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

// Token set for the containment check below.
const coreTokens = (s) => new Set(normCore(s).split(' ').filter(Boolean));

// Small connector words that real-world acronyms typically skip (e.g. "Madras
// Institute of Technology" -> MIT, not MIOT). Distinct from FILLER_WORDS, which
// ARE meant to contribute a letter (e.g. the "C" in AAMEC comes from "College").
const ACRONYM_SKIP_WORDS = new Set(['OF', 'AND', 'THE', 'FOR']);

// Builds the acronym a real institution would actually go by, from its full
// spelled-out name — e.g. "Anjalai Ammal Mahalingam Engineering College" -> "AAMEC".
const acronymOf = (s) => normStrict(s)
  .split(' ')
  .filter(Boolean)
  .filter(w => !ACRONYM_SKIP_WORDS.has(w))
  .map(w => w[0])
  .join('');

// Public comparator: exact strict match first; only fall back to the core
// (filler-word-stripped) comparison, and only when the core key still has
// real identifying content (2+ chars) — this avoids two unrelated colleges
// accidentally matching just because both names happened to reduce to a
// short leftover fragment.
const collegesMatch = (a, b) => {
  const strictA = normStrict(a);
  const strictB = normStrict(b);
  if (strictA === strictB) return true;

  // Acronym tier: one side may be typed as a short-form acronym of the
  // other's full spelled-out name (e.g. "AAMEC" vs "Anjalai Ammal
  // Mahalingam Engineering College"). Guarded to 3-8 letters so a short,
  // generic string can't coincidentally match an unrelated long name.
  const acrA = acronymOf(a);
  const acrB = acronymOf(b);
  const looksLikeAcronym = (s) => s.length >= 3 && s.length <= 8;
  if (looksLikeAcronym(strictA) && strictA === acrB) return true;
  if (looksLikeAcronym(strictB) && strictB === acrA) return true;

  const coreA = normCore(a);
  const coreB = normCore(b);
  if (!coreA || !coreB || coreA.length < 2) return false;

  if (coreA === coreB) return true;

  // Containment tier: if every core word of the SHORTER name appears in the
  // LONGER name, treat them as the same college (handles a location/campus
  // suffix being present on only one side, e.g. "RMS Engineering College"
  // vs "RMS Engineering College Orathanadu").
  const tokensA = coreTokens(a);
  const tokensB = coreTokens(b);
  const [shorter, longer] = tokensA.size <= tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];

  // Require at least 2 shared core words (or the shorter side to be a single,
  // reasonably specific word of 3+ chars — real abbreviations like RMS, SRM,
  // PSG, MIT) so a lone short/generic token doesn't cause an over-eager match
  // between two unrelated colleges.
  if (shorter.size === 0) return false;
  const allContained = [...shorter].every(t => longer.has(t));
  if (!allContained) return false;

  return shorter.size >= 2 || [...shorter][0].length >= 3;
};

module.exports = { normStrict, normCore, collegesMatch };