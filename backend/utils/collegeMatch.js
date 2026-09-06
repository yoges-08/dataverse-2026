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
  .replace(/&/g, ' AND ')
  .replace(/['’`.,]/g, '')
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

// Known campus/district locations in Tamil Nadu & South India to safely distinguish
// location suffixes from distinct institution brand names.
const KNOWN_LOCATIONS = new Set([
  'KOVILVENNI', 'KOVILVEENI', 'PUNALKULAM', 'ORATHANADU', 'THANJAVUR',
  'TIRUCHIRAPPALLI', 'TRICHY', 'CHENNAI', 'COIMBATORE', 'MADURAI', 'SALEM',
  'POLLACHI', 'KUMBAKONAM', 'NAGAPATTINAM', 'TIRUVARUR', 'PERAMBALUR',
  'ARIYALUR', 'PUDUKKOTTAI', 'KARUR', 'DINDIGUL', 'ERODE', 'TIRUPPUR',
  'VELLORE', 'KANCHIPURAM', 'TIRUNELVELI', 'SIVAGANGAI', 'VIRUDHUNAGAR',
  'THENI', 'KRISHNAGIRI', 'DHARMAPURI', 'CUDDALORE', 'VILLUPURAM',
  'KALLAKURICHI', 'TENKASI', 'TIRUVANNAMALAI', 'RANIPET', 'TIRUPATTUR',
  'CHENGALPATTU', 'KANYAKUMARI', 'NAGERCOIL', 'TUTICORIN', 'THOOTHUKUDI',
  'AVADI', 'TAMBARAM', 'SIRKAZHI', 'MAYILADUTHURAI', 'NAMAKKAL', 'NILGIRIS',
  'OOTY', 'HOSUR', 'SIVAKASI', 'KARAISUTHI', 'VALLIOOR', 'CHIDAMBARAM',
  'NEYVELI', 'METTUR', 'PALANI', 'RAJAPALAYAM', 'PARAMAKUDI', 'RAMANATHAPURAM'
]);

// Known aliases and squashed canonical forms for the host college of this symposium.
// Guarantees every common way a student might type "Anjalai Ammal Mahalingam Engineering
// College Kovilvenni" (including merged words e.g. "Anjalaiammal Mahalingam..." or
// short form "AAMEC") is recognized as the SAME college — without loosening the
// general-purpose matcher used for every other college.
const HOST_COLLEGE_ALIASES = new Set(
  ['AAMEC', 'AAMEC KOVILVENNI', 'AAMEC KOVILVEENI'].map(normStrict)
);

const HOST_CANONICAL_SQUASHES = new Set([
  normSquash('Anjalai Ammal Mahalingam Engineering College'),
  normSquash('Anjalai Ammal Mahalingam Engineering College Kovilvenni'),
  normSquash('Anjalai Ammal Mahalingam Engineering College Kovilveeni')
]);

const isHostAlias = (s) => {
  const strict = normStrict(s);
  const squash = normSquash(s);
  return HOST_COLLEGE_ALIASES.has(strict) || HOST_CANONICAL_SQUASHES.has(squash);
};

const isHostCollege = (s) => {
  const strict = normStrict(s);
  const squash = normSquash(s);
  if (HOST_COLLEGE_ALIASES.has(strict) || HOST_CANONICAL_SQUASHES.has(squash)) return true;
  // Acronym AAMEC check
  if (squash.startsWith('AAMEC')) return true;
  // Must require both key distinctive words: Anjalai AND Mahalingam
  const tokens = coreTokens(s);
  const hasAnjalai = tokens.has('ANJALAI') || tokens.has('ANJALAIAMMAL') || squash.includes('ANJALAI');
  const hasMahalingam = tokens.has('MAHALINGAM') || squash.includes('MAHALINGAM');
  return !!(hasAnjalai && hasMahalingam);
};

// Per-word budget: how many edits we tolerate for a single word, scaled to
// that word's own length (short words need a tighter budget to stay safe).
const tokenEditBudget = (len) => (len <= 3 ? 0 : len <= 6 ? 1 : len <= 12 ? 2 : 3);

// Token-level fuzzy containment: every core word of the SHORTER name must
// closely match some core word of the LONGER name.
const tokenFuzzyContains = (shortTokens, longTokens) =>
  shortTokens.every(st =>
    longTokens.some(lt => {
      const budget = Math.max(tokenEditBudget(st.length), tokenEditBudget(lt.length));
      if (Math.min(st.length, lt.length) <= 3) return st === lt;
      return editDistance(st, lt, budget) <= budget;
    })
  );

const tokenFuzzyMatch = (a, b) => {
  const tokensA = normCore(a).split(' ').filter(Boolean);
  const tokensB = normCore(b).split(' ').filter(Boolean);
  const [shortTokens, longTokens] = tokensA.length <= tokensB.length
    ? [tokensA, tokensB] : [tokensB, tokensA];
  if (shortTokens.length === 0) return false;
  // 1-token short form against 3+ token long form must never fuzzy match
  if (shortTokens.length === 1 && longTokens.length >= 3) return false;
  if (shortTokens.length === 1 && shortTokens[0].length < 6) return false;
  if (shortTokens.length === 1 && longTokens.length === 2) {
    const matchedIdx = longTokens.findIndex(lt => {
      const budget = Math.max(tokenEditBudget(shortTokens[0].length), tokenEditBudget(lt.length));
      return editDistance(shortTokens[0], lt, budget) <= budget;
    });
    if (matchedIdx !== -1) {
      const extraToken = longTokens[matchedIdx === 0 ? 1 : 0];
      if (!KNOWN_LOCATIONS.has(extraToken)) return false;
    }
  }
  if (shortTokens.length >= 2 && longTokens.length - shortTokens.length > 1) {
    return false;
  }
  return tokenFuzzyContains(shortTokens, longTokens);
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

  // Host-college alias check: fast resolution for symposium host institution
  if (isHostAlias(a) && isHostAlias(b)) return true;

  // Split/merged-word tier: same letters, same order, only the spacing
  // differs. Guarded on length so two short, generic names typed with
  // different spacing can't coincidentally squash to the same short string.
  const squashA = normSquash(a);
  const squashB = normSquash(b);
  const MIN_SQUASH_LENGTH = 10;
  if (squashA === squashB && squashA.length >= MIN_SQUASH_LENGTH) return true;

  // Acronym tier: one side may be typed as a short-form acronym of the
  // other's full spelled-out name (e.g. "AAMEC" vs "Anjalai Ammal
  // Mahalingam Engineering College").
  if (acronymMatch(a, b) || acronymMatch(b, a)) return true;

  const coreA = normCore(a);
  const coreB = normCore(b);
  if (!coreA || !coreB || coreA.length < 2) return false;

  if (coreA === coreB) return true;

  // Containment tier: if every core word of the SHORTER name appears in the
  // LONGER name, treat them as the same college if the extra words represent
  // a location/campus suffix (e.g. "Anjalai Ammal Mahalingam..." vs "... Kovilvenni"
  // or "Kings College of Engineering" vs "... Punalkulam").
  const tokensA = coreTokens(a);
  const tokensB = coreTokens(b);
  const [shorter, longer] = tokensA.size <= tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];

  if (shorter.size === 0) return false;
  const allContained = [...shorter].every(t => longer.has(t));
  if (allContained) {
    const diff = [...longer].filter(t => !shorter.has(t));
    if (shorter.size >= 2 && diff.length <= 1) return true;
    if (shorter.size === 1 && diff.length === 1 && KNOWN_LOCATIONS.has(diff[0])) return true;
  }

  // Fuzzy tier (last resort): tolerates small free-text typos
  const coreSquashA = coreA.replace(/\s+/g, '');
  const coreSquashB = coreB.replace(/\s+/g, '');
  const fuzzyA = coreSquashA.length <= coreSquashB.length ? coreSquashA : coreSquashB;
  const fuzzyB = coreSquashA.length <= coreSquashB.length ? coreSquashB : coreSquashA;
  if (fuzzyA.length >= 6) {
    const budget = Math.min(2, Math.floor(fuzzyB.length / 14) + 1);
    if (editDistance(fuzzyA, fuzzyB, budget) <= budget) return true;
  }

  // Token-level fuzzy containment tier (handles typo in one word + extra location word):
  return tokenFuzzyMatch(a, b);
};

module.exports = { normStrict, normCore, collegesMatch, isHostCollege, tokenFuzzyMatch, KNOWN_LOCATIONS };