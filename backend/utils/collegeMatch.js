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

const looksLikeAcronym = (s) => s.length >= 3 && s.length <= 8;

// How many extra trailing letters an acronym-prefix match may tolerate. A
// location/campus suffix on the full-name side adds one initial per extra
// word ("AAMEC" -> "AAMECK" from a trailing "Kovilveeni"). Bounded so a short
// acronym can't prefix-match an unrelated long name by stretching too far.
const MAX_ACRONYM_SUFFIX_SLACK = 3;

// Acronym tier matcher. shortForm must look like a real acronym (3-8 chars);
// longAcronym is the initials built from the other, spelled-out name. Compares
// as a PREFIX match with bounded slack, mirroring the suffix tolerance the
// containment tier already has — so "AAMEC" matches "... College Kovilveeni"
// (longAcronym "AAMECK", +1 letter) instead of silently failing.
const acronymMatchesLongName = (shortForm, longAcronym) => {
  if (!looksLikeAcronym(shortForm)) return false;
  if (longAcronym === shortForm) return true;
  return longAcronym.startsWith(shortForm) &&
    (longAcronym.length - shortForm.length) <= MAX_ACRONYM_SUFFIX_SLACK;
};

// Candidate acronym forms for a given input: the whole string, and — when
// it's more than one word — just its FIRST word. This is what lets "AAMEC
// Kovilvenni" (an acronym with a location suffix attached) still be
// recognized as "AAMEC": tested as a whole string it's too long to look
// like an acronym at all, so without this, the acronym tier silently never
// ran for a student who typed it this way.
const acronymCandidates = (s) => {
  const whole = normStrict(s);
  const first = whole.split(' ')[0] || '';
  return first && first !== whole ? [whole, first] : [whole];
};

// Tests whether shortSide (as a whole, or just its leading word) is an
// acronym of longSide's full spelled-out name.
const acronymMatch = (shortSide, longSide) => {
  const longAcronym = acronymOf(longSide);
  return acronymCandidates(shortSide).some(cand => acronymMatchesLongName(cand, longAcronym));
};

// Bounded Levenshtein edit distance, capped at `max` for speed — once the
// cheapest possible path through the DP table exceeds `max` we can stop
// caring about the exact number, so this returns max+1 as an "over budget"
// sentinel instead of the true (larger) distance.
const editDistance = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      cur.push(val);
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > max) return max + 1; // whole row over budget, no point continuing
    prev = cur;
  }
  return prev[b.length];
};

// Squash normalize: the strict form with ALL internal whitespace removed
// (not just collapsed). This makes "R M K Engineering College" and "RMK
// Engineering College" — or "Rajalakshmi Engineering College" and "Raja
// Lakshmi Engineering College" — compare equal: the letters and their
// order are identical, only where the word boundaries fall differs.
const normSquash = (s) => normStrict(s).replace(/\s+/g, '');

// Public comparator: exact strict match first; only fall back to the core
// (filler-word-stripped) comparison, and only when the core key still has
// real identifying content (2+ chars) — this avoids two unrelated colleges
// accidentally matching just because both names happened to reduce to a
// short leftover fragment.
const collegesMatch = (a, b) => {
  const strictA = normStrict(a);
  const strictB = normStrict(b);
  if (strictA === strictB) return true;

  // Split/merged-word tier: same letters, same order, only the spacing
  // differs. Guarded on length so two short, generic names typed with
  // different spacing can't coincidentally squash to the same short string
  // (e.g. "AB College" vs "A B College" — plausibly two different, unrelated
  // small colleges, not worth risking a false merge over).
  const squashA = normSquash(a);
  const squashB = normSquash(b);
  const MIN_SQUASH_LENGTH = 10;
  if (squashA === squashB && squashA.length >= MIN_SQUASH_LENGTH) return true;

  // Acronym tier: one side may be typed as a short-form acronym of the
  // other's full spelled-out name (e.g. "AAMEC" vs "Anjalai Ammal
  // Mahalingam Engineering College"). Tolerates a bounded location/campus
  // suffix on the long-name side (e.g. "... College Kovilveeni"), and
  // treats the FIRST word as an acronym candidate so an acronym typed with
  // its own location suffix ("AAMEC Kovilvenni") still matches.
  if (acronymMatch(a, b) || acronymMatch(b, a)) return true;

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
  if (allContained && (shorter.size >= 2 || [...shorter][0].length >= 3)) return true;

  // Fuzzy tier (last resort): tolerates small free-text typos — a missing/
  // doubled letter, a swap, one wrong character — most often landing in a
  // location suffix ("kovilvenni" vs "kovilveni"). Compared on the CORE
  // (filler words like "Engineering College" already stripped, then
  // squashed) rather than the full name — shared generic words are long and
  // would otherwise dilute the distance budget, masking a real difference
  // in the short, distinctive part of the name (e.g. "SRM" vs "SSN"
  // Engineering College must NOT match just because both end the same way).
  const coreSquashA = coreA.replace(/\s+/g, '');
  const coreSquashB = coreB.replace(/\s+/g, '');
  const fuzzyA = coreSquashA.length <= coreSquashB.length ? coreSquashA : coreSquashB;
  const fuzzyB = coreSquashA.length <= coreSquashB.length ? coreSquashB : coreSquashA;
  if (fuzzyA.length < 10) return false; // too short to fuzzy-match safely
  const budget = Math.min(2, Math.floor(fuzzyB.length / 14) + 1);
  return editDistance(fuzzyA, fuzzyB, budget) <= budget;
};

module.exports = { normStrict, normCore, collegesMatch };