export const RELATION_OPTIONS = [
  'પિતા', 'માતા', 'ભાઈ', 'બહેન', 'પુત્ર', 'દીકરી',
  'પતિ', 'પત્ની', 'દાદા', 'દાદી', 'કાકા', 'કાકી', 'અન્ય',
] as const;

export type Relation = typeof RELATION_OPTIONS[number];

// Normalize free-text/voice → one of the dropdown options
export const normalizeRelation = (raw: string): Relation | '' => {
  const t = (raw || '').trim().toLowerCase();
  if (!t) return '';
  const map: Record<string, Relation> = {
    'પિતા': 'પિતા', 'પપ્પા': 'પિતા', 'બાપુજી': 'પિતા', 'father': 'પિતા', 'dad': 'પિતા', 'papa': 'પિતા',
    'માતા': 'માતા', 'મમ્મી': 'માતા', 'મા': 'માતા', 'mother': 'માતા', 'mom': 'માતા', 'mummy': 'માતા',
    'ભાઈ': 'ભાઈ', 'brother': 'ભાઈ',
    'બહેન': 'બહેન', 'બેન': 'બહેન', 'sister': 'બહેન',
    'પુત્ર': 'પુત્ર', 'દીકરો': 'પુત્ર', 'son': 'પુત્ર',
    'દીકરી': 'દીકરી', 'પુત્રી': 'દીકરી', 'daughter': 'દીકરી',
    'પતિ': 'પતિ', 'husband': 'પતિ',
    'પત્ની': 'પત્ની', 'wife': 'પત્ની',
    'દાદા': 'દાદા', 'grandfather': 'દાદા',
    'દાદી': 'દાદી', 'grandmother': 'દાદી',
    'કાકા': 'કાકા', 'uncle': 'કાકા',
    'કાકી': 'કાકી', 'aunt': 'કાકી',
  };
  for (const key of Object.keys(map)) {
    if (t.includes(key.toLowerCase())) return map[key];
  }
  return 'અન્ય';
};
