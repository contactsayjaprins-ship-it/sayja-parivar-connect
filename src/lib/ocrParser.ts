// Smart Gujarati OCR text → structured form data
// Uses keyword/regex mapping with fuzzy label detection.

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

const findTotalMembers = (val: string): number => {
  const m = val.match(/\d+/);
  return m ? parseInt(m[0], 10) : 1;
};

export const parseOcrText = (raw: string): Partial => {
  const text = raw.replace(/\r/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: Partial = { members: [] };

  // Line-based label detection
  for (const line of lines) {
    for (const { keys, field } of LABEL_MAP) {
      const key = keys.find(k => line.toLowerCase().includes(k.toLowerCase()));
      if (!key) continue;
      const idx = line.toLowerCase().indexOf(key.toLowerCase());
      const after = line.slice(idx + key.length);
      const val = cleanValue(after);
      if (!val) break;
      if (field === 'totalMembers') {
        (result as any)[field] = findTotalMembers(val);
      } else if (!(result as any)[field]) {
        (result as any)[field] = val;
      }
      break;
    }
  }

  // Mobile + email scan over whole text
  const mobile = findMobile(text);
  if (mobile) (result as any).mobile = mobile;
  const email = findEmail(text);
  if (email && !result.email) result.email = email;

  // Family member extraction — heuristic: lines with relation keyword + mobile
  const RELATIONS = ['પિતા', 'માતા', 'પત્ની', 'પતિ', 'પુત્ર', 'પુત્રી', 'ભાઈ', 'બહેન', 'દાદા', 'દાદી', 'કાકા', 'કાકી', 'મામા'];
  for (const line of lines) {
    const rel = RELATIONS.find(r => line.includes(r));
    if (!rel) continue;
    const memberMobile = findMobile(line);
    const cleaned = line
      .replace(rel, '|REL|')
      .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/, '|MOB|');
    const parts = cleaned.split(/[|,।]/).map(p => p.trim()).filter(Boolean);
    const name = parts.find(p => !p.includes('REL') && !p.includes('MOB')) || '';
    result.members!.push({
      name: cleanValue(name),
      relation: rel,
      occupation: '',
      education: '',
      mobile: memberMobile,
      gender: ['માતા', 'પત્ની', 'પુત્રી', 'બહેન', 'દાદી', 'કાકી'].includes(rel) ? 'સ્ત્રી' : 'પુરુષ',
      photo: '',
    });
  }

  return result;
};
