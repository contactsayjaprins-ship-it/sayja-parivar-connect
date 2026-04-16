// Smart Gujarati OCR/Voice text → structured form data
// Supports: main fields, member rows (table), and per-member voice ("સભ્ય 1 નામ ..., સંબંધ ...")

import { FamilyProfile, FamilyMember } from './store';

export type ParsedOcr = Partial<Omit<FamilyProfile, 'id' | 'createdAt' | 'updatedAt' | 'members'>> & {
  members?: Omit<FamilyMember, 'id'>[];
};

const LABEL_MAP: { keys: string[]; field: keyof ParsedOcr }[] = [
  { keys: ['નામ'], field: 'name' },
  { keys: ['મૂળ ગામ', 'મુળ ગામ', 'મૂળગામ'], field: 'nativeVillage' },
  { keys: ['હાલ ગામ', 'હાલગામ', 'હાલનું ગામ'], field: 'currentVillage' },
  { keys: ['વ્યવસાય', 'ધંધો'], field: 'occupation' },
  { keys: ['ભણતર', 'શિક્ષણ', 'અભ્યાસ'], field: 'education' },
  { keys: ['કુલ સભ્ય', 'કુલ સભ્યો', 'ઘરનાં કુલ સભ્ય', 'સભ્યો'], field: 'totalMembers' },
  { keys: ['એડ્રેસ', 'સરનામું', 'સરનામુ'], field: 'address' },
  { keys: ['ઈમેઈલ', 'ઇમેઇલ', 'email', 'Email'], field: 'email' },
];

// Member field keywords (used in voice parsing per-member)
const MEMBER_FIELD_MAP: { keys: string[]; field: keyof Omit<FamilyMember, 'id' | 'photo'> }[] = [
  { keys: ['નામ'], field: 'name' },
  { keys: ['સંબંધ'], field: 'relation' },
  { keys: ['વ્યવસાય', 'ધંધો'], field: 'occupation' },
  { keys: ['ભણતર', 'શિક્ષણ', 'અભ્યાસ'], field: 'education' },
  { keys: ['મોબાઇલ', 'મોબાઈલ', 'ફોન', 'નંબર'], field: 'mobile' },
  { keys: ['લિંગ', 'જાતિ'], field: 'gender' },
];

const FEMALE_RELATIONS = ['માતા', 'પત્ની', 'પુત્રી', 'બહેન', 'દાદી', 'કાકી', 'મામી', 'ફોઈ', 'નાની'];
const RELATIONS = ['પિતા', 'માતા', 'પત્ની', 'પતિ', 'પુત્ર', 'પુત્રી', 'ભાઈ', 'બહેન', 'દાદા', 'દાદી', 'કાકા', 'કાકી', 'મામા', 'મામી', 'ફોઈ', 'નાના', 'નાની'];

const cleanValue = (raw: string) =>
  raw
    .replace(/^[\s:\-–—=>।|]+/, '')
    .replace(/[\s:\-–—=>।|]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

const findMobile = (text: string): string => {
  const m = text.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
  return m ? m[0].replace(/\D/g, '').slice(-10) : '';
};

const findEmail = (text: string): string => {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0] : '';
};

const findInt = (val: string): number => {
  const m = val.match(/\d+/);
  return m ? parseInt(m[0], 10) : 1;
};

const inferGender = (relation: string, explicit?: string): 'પુરુષ' | 'સ્ત્રી' => {
  if (explicit) {
    if (explicit.includes('સ્ત્રી') || explicit.toLowerCase().includes('female')) return 'સ્ત્રી';
    if (explicit.includes('પુરુષ') || explicit.toLowerCase().includes('male')) return 'પુરુષ';
  }
  return FEMALE_RELATIONS.some(r => relation.includes(r)) ? 'સ્ત્રી' : 'પુરુષ';
};

// Parse a single member sentence: "નામ રમેશ, સંબંધ પિતા, વ્યવસાય ખેતી, ..."
export const parseMemberSentence = (sentence: string): Partial<Omit<FamilyMember, 'id'>> => {
  const out: Partial<Omit<FamilyMember, 'id'>> = {};
  const parts = sentence.split(/[,।]/).map(p => p.trim()).filter(Boolean);
  for (const part of parts) {
    for (const { keys, field } of MEMBER_FIELD_MAP) {
      const key = keys.find(k => part.toLowerCase().startsWith(k.toLowerCase()) || part.toLowerCase().includes(' ' + k.toLowerCase() + ' '));
      if (!key) continue;
      const idx = part.toLowerCase().indexOf(key.toLowerCase());
      const val = cleanValue(part.slice(idx + key.length));
      if (!val) break;
      if (field === 'mobile') {
        const mob = findMobile(val);
        if (mob) out.mobile = mob;
      } else if (field === 'gender') {
        out.gender = inferGender('', val);
      } else {
        (out as any)[field] = val;
      }
      break;
    }
  }
  // Fallback: detect a relation keyword anywhere if not set
  if (!out.relation) {
    const rel = RELATIONS.find(r => sentence.includes(r));
    if (rel) out.relation = rel;
  }
  if (!out.mobile) {
    const mob = findMobile(sentence);
    if (mob) out.mobile = mob;
  }
  if (!out.gender && out.relation) out.gender = inferGender(out.relation);
  return out;
};

// Parse voice text containing one or more "સભ્ય N ..." segments
export const parseMembersVoice = (text: string): { index: number; data: Partial<Omit<FamilyMember, 'id'>> }[] => {
  const results: { index: number; data: Partial<Omit<FamilyMember, 'id'>> }[] = [];
  // Split by "સભ્ય <num>" markers
  const re = /સભ્ય\s*(\d+)/g;
  const matches = [...text.matchAll(re)];
  if (!matches.length) return results;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const segment = text.slice(start, end).trim();
    const idx = parseInt(m[1], 10) - 1;
    if (idx < 0) continue;
    results.push({ index: idx, data: parseMemberSentence(segment) });
  }
  return results;
};

export const parseOcrText = (raw: string): ParsedOcr => {
  const text = raw.replace(/\r/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: ParsedOcr = { members: [] };

  // Line-based main label detection
  for (const line of lines) {
    for (const { keys, field } of LABEL_MAP) {
      const key = keys.find(k => line.toLowerCase().includes(k.toLowerCase()));
      if (!key) continue;
      const idx = line.toLowerCase().indexOf(key.toLowerCase());
      const after = line.slice(idx + key.length);
      const val = cleanValue(after);
      if (!val) break;
      if (field === 'totalMembers') {
        (result as any)[field] = findInt(val);
      } else if (!(result as any)[field]) {
        (result as any)[field] = val;
      }
      break;
    }
  }

  // Mobile + email scan over whole text (for main user)
  const mobile = findMobile(text);
  if (mobile) (result as any).mobile = mobile;
  const email = findEmail(text);
  if (email && !result.email) result.email = email;

  // === Member extraction ===
  // Strategy A: voice "સભ્ય N ..." segments
  const voiceMembers = parseMembersVoice(text);
  if (voiceMembers.length) {
    voiceMembers.forEach(({ index, data }) => {
      while (result.members!.length <= index) {
        result.members!.push({ name: '', relation: '', occupation: '', education: '', mobile: '', gender: 'પુરુષ', photo: '' });
      }
      result.members![index] = { ...result.members![index], ...data } as Omit<FamilyMember, 'id'>;
    });
  }

  // Strategy B: table-row heuristic — lines containing a relation keyword
  // Treats line as: relation | name | occupation | education | mobile (separated by | , tab or 2+ spaces)
  for (const line of lines) {
    const rel = RELATIONS.find(r => line.includes(r));
    if (!rel) continue;
    // Skip if this looks like a label-only line for the main user
    if (LABEL_MAP.some(({ keys }) => keys.some(k => line.trim().startsWith(k)))) continue;
    const memberMobile = findMobile(line);
    const cols = line.split(/[|\t,।]|\s{2,}/).map(c => c.trim()).filter(Boolean);
    // Try to detect relation column index
    let relIdx = cols.findIndex(c => c.includes(rel));
    if (relIdx === -1) relIdx = 0;
    const get = (i: number) => cols[i] ? cleanValue(cols[i].replace(rel, '').replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/, '')) : '';
    // Mapping: rel | name | occupation | education | mobile
    const name = get(relIdx + 1) || cols.find((c, i) => i !== relIdx && !/^\d+$/.test(c) && !/[6-9]\d{9}/.test(c)) || '';
    const occupation = get(relIdx + 2);
    const education = get(relIdx + 3);

    // Avoid duplicates already filled by voice
    const exists = result.members!.some(m => m.relation === rel && m.name === name);
    if (exists) continue;

    result.members!.push({
      name: cleanValue(name),
      relation: rel,
      occupation: cleanValue(occupation),
      education: cleanValue(education),
      mobile: memberMobile,
      gender: inferGender(rel),
      photo: '',
    });
  }

  return result;
};
