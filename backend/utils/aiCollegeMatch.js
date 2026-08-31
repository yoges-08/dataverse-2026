const { collegesMatch, normStrict } = require('./collegeMatch');
const CollegeMatchCache = require('../models/CollegeMatchCache');

// Builds a canonical, sorted key for a pair of college names so (A, B) and (B, A)
// map to the exact same cache entry.
const buildPairKey = (a, b) => {
  const normA = normStrict(a);
  const normB = normStrict(b);
  return normA <= normB ? `${normA}|||${normB}` : `${normB}|||${normA}`;
};

/**
 * Compares two college names:
 * 1. Fast path: Deterministic collegesMatch (free, synchronous check).
 * 2. Cache lookup: If previously judged by AI / override, return cached verdict.
 * 3. AI fallback (Anthropic / Claude Haiku if ANTHROPIC_API_KEY is configured):
 *    Strictly classifies whether two strings refer to the same real institution.
 * 4. Fails closed (returns false if API key missing, offline, or on error).
 */
const collegesMatchWithAI = async (a, b) => {
  if (!a || !b) return false;

  // 1. Fast deterministic check (free & instant)
  if (collegesMatch(a, b)) return true;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fail closed to deterministic matching only if no AI key configured
    return false;
  }

  const pairKey = buildPairKey(a, b);

  // 2. Check Database Cache
  try {
    const cached = await CollegeMatchCache.findOne({ pairKey }).lean();
    if (cached) {
      return Boolean(cached.isMatch);
    }
  } catch (err) {
    console.warn('[aiCollegeMatch] Cache lookup error:', err.message);
  }

  // 3. AI fallback call
  try {
    const prompt = `You are a strict data-matching classifier for college and university symposium registration in Tamil Nadu / India.
Determine whether the following two free-text college names refer to the SAME REAL-WORLD INSTITUTION or not.

Rules:
- Ignore small typos, missing apostrophes, spacing differences, abbreviations (e.g. AAMEC vs Anjalai Ammal Mahalingam Engineering College), or dropped words like "College of Engineering".
- Different campuses or branches of the same university system (e.g. Anna University Chennai vs Anna University Trichy) MUST be classified as DIFFERENT (false).
- If uncertain or if they might be two distinct colleges, classify as DIFFERENT (false).

College A: "${a}"
College B: "${b}"

Respond ONLY with a JSON object in this exact format:
{
  "isMatch": true or false,
  "confidence": "high" or "medium" or "low",
  "reason": "short 1-sentence explanation"
}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      console.warn(`[aiCollegeMatch] Anthropic API returned status ${res.status}`);
      return false;
    }

    const data = await res.json();
    const replyText = data.content?.[0]?.text || '{}';
    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const isMatch = Boolean(parsed.isMatch);

    // 4. Persist verdict in Cache
    try {
      await CollegeMatchCache.updateOne(
        { pairKey },
        {
          $set: {
            pairKey,
            nameA: a,
            nameB: b,
            isMatch,
            confidence: parsed.confidence || 'medium',
            reason: parsed.reason || 'AI evaluated',
            source: 'ai'
          }
        },
        { upsert: true }
      );
    } catch (saveErr) {
      console.warn('[aiCollegeMatch] Failed to save cache entry:', saveErr.message);
    }

    return isMatch;
  } catch (err) {
    console.warn('[aiCollegeMatch] AI evaluation failed, failing closed:', err.message);
    return false;
  }
};

module.exports = { collegesMatchWithAI, buildPairKey };
