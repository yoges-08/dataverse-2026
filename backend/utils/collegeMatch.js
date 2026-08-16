// College-name matching for team management. free-text college names need
// more than case-folding to match: normalize hidden characters and drop
// generic institution words so abbreviation-style variants collapse.
//
//   collegesMatch('J J Engineering', 'J J Engineering College')  -> true
//   collegesMatch('Kings Engineering College', 'Kings College College') -> true
//   collegesMatch('AAA\xa0', 'aaa')                               -> true (NFKC)
//   collegesMatch('ABC Engineering College', 'XYZ Engineering')   -> false

// Generic institution words that carry no identifying signal on their own —
// stripping them lets "J J Engineering" and "J J Engineering College" (or
// "Kings Engineering College" and "Kings College of Engineering") reduce to
// the same core name.
const FILLER_WORDS = new Set([
  'COLLEGE', 'OF', 'ENGINEERING', 'TECHNOLOGY', 'INSTITUTE', 'AND',
  'SCIENCE', 'SCIENCES', 'THE', 'FOR', 'POLYTECHNIC', 'UNIVERSITY',
  'ARTS', 'MANAGEMENT', 'STUDIES', 'EDUCATIONAL', 'TRUST', 'INSTITUTIONS',
  'SCHOOL'
]);

// Strict normalize: case + hidden-character hardening only, no words dropped.
// .normalize('NFKC') folds visually-identical unicode variants (e.g. a
// non-breaking space, or full-width characters) down to their plain form
// before trimming/collapsing whitespace — this is the part the old
// .trim().toUpperCase() couldn't catch.
const normStrict = (s) => String(s || '')
  .normalize('NFKC')
  .replace(/[.,]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase();

// Core normalize: strict form, then strip generic filler words, so name
// variants and abbreviations collapse to the same key.
const normCore = (s) => {
  const tokens = normStrict(s).split(' ').filter(Boolean);
  const core = tokens.filter(t => !FILLER_WORDS.has(t));
  // If removing filler words leaves nothing (e.g. the college name IS just
  // "Engineering College"), fall back to the full strict form instead of
  // matching on an empty string.
  return core.length ? core.join(' ') : tokens.join(' ');
};

// Public comparator: exact strict match first; only fall back to the core
// (filler-word-stripped) comparison, and only when the core key still has
// real identifying content (2+ chars) — this avoids two unrelated colleges
// accidentally matching just because both names happened to reduce to a
// short leftover fragment.
const collegesMatch = (a, b) => {
  const strictA = normStrict(a);
  const strictB = normStrict(b);
  if (strictA === strictB) return true;

  const coreA = normCore(a);
  const coreB = normCore(b);
  if (!coreA || !coreB || coreA.length < 2) return false;

  return coreA === coreB;
};

module.exports = { normStrict, normCore, collegesMatch };