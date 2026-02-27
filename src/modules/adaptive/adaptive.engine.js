export function getNextDifficulty(current, events) {
  const recent3 = events.slice(-3);
  const allFastAndCorrect = recent3.length === 3 && recent3.every((e) => e.correct && e.timeMs <= 7000);
  const recentAccuracy = events.slice(-6);
  const accuracy = recentAccuracy.filter((e) => e.correct).length / Math.max(recentAccuracy.length, 1);
  if (allFastAndCorrect) return Math.min(current + 1, 10);
  if (accuracy < 0.5) return Math.max(current - 1, 1);
  return current;
}
