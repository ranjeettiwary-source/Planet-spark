function avg(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function computeAnalytics(answers) {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const accuracyPct = total ? (correct / total) * 100 : 0;
  const speedScore = Math.max(0, 100 - avg(answers.map((a) => a.timeMs)) / 150);
  const conceptAnswers = answers.filter((a) => a.round === 'CONCEPT_PROBE');
  const conceptScore = avg(conceptAnswers.map((a) => (a.explanationScore ?? 0) * 10));
  const appAnswers = answers.filter((a) => a.round === 'APPLICATION' || a.round === 'VEDIC_SPEED');
  const applicationScore = appAnswers.length ? (appAnswers.filter((a) => a.correct).length / appAnswers.length) * 100 : 0;
  const streaks = [];
  let streak = 0;
  for (const answer of answers) {
    streak = answer.correct ? streak + 1 : 0;
    streaks.push(streak);
  }
  const consistency = Math.min(100, avg(streaks) * 20);
  const confidenceIndex = Math.round(0.35 * accuracyPct + 0.25 * speedScore + 0.2 * consistency + 0.2 * conceptScore);

  return {
    accuracyPct: Math.round(accuracyPct),
    numberSense: Math.round(accuracyPct),
    speed: Math.round(speedScore),
    concept: Math.round(conceptScore),
    application: Math.round(applicationScore),
    confidenceIndex,
  };
}
