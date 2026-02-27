const LOGIC_KEYWORDS = ['because', 'therefore', 'first', 'then', 'so'];
const MATH_VOCAB = ['sum', 'difference', 'carry', 'borrow', 'multiple', 'factor', 'quotient'];

export function scoreExplanation(text = '') {
  const t = text.toLowerCase();
  const logicHits = LOGIC_KEYWORDS.filter((k) => t.includes(k)).length;
  const vocabHits = MATH_VOCAB.filter((k) => t.includes(k)).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lengthScore = Math.min(words / 20, 1);
  const raw = logicHits * 0.4 + vocabHits * 0.4 + lengthScore * 0.2;
  return Math.round(Math.min(raw / 3, 1) * 10);
}
