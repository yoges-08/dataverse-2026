export const EVENT_EMOJIS = {
  'Agentic AI': '🤖',
  'NovaSpeak': '🎤',
  'Knowledge Knockout': '🥊',
  'Bug Hunt': '🐛',
  'Code Sprint': '💻',
  'Layman Vibes': '🎭',
  'Luminas Fest': '🎯',
  'Viral Vision': '🎬'
};

export const getEventEmoji = (title = '') => {
  if (!title) return '🏆';
  if (EVENT_EMOJIS[title]) return EVENT_EMOJIS[title];

  const lower = String(title).toLowerCase();
  if (lower.includes('agentic') || lower.includes('prompt')) return '🤖';
  if (lower.includes('nova') || lower.includes('speak') || lower.includes('paper')) return '🎤';
  if (lower.includes('knockout') || lower.includes('knowledge') || lower.includes('quiz')) return '🥊';
  if (lower.includes('bug') || lower.includes('hunt') || lower.includes('debug')) return '🐛';
  if (lower.includes('sprint') || lower.includes('code')) return '💻';
  if (lower.includes('layman') || lower.includes('vibes') || lower.includes('ad-mad')) return '🎭';
  if (lower.includes('luminas') || lower.includes('fest') || lower.includes('game')) return '🎯';
  if (lower.includes('viral') || lower.includes('vision') || lower.includes('reel')) return '🎬';
  if (lower.includes('web')) return '🌐';
  if (lower.includes('hack')) return '⚡';
  return '🏆';
};

export const formatEventWithEmoji = (title = '') => {
  if (!title) return '';
  const emoji = getEventEmoji(title);
  const trimmed = String(title).trim();
  if (trimmed.startsWith(emoji)) return trimmed;
  return `${emoji} ${trimmed}`;
};

export default getEventEmoji;
