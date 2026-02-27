export function buildReportText(session) {
  return [
    'Math Rapid Fire Pro - Session Report',
    `Student: ${session.studentName}`,
    `Grade: ${session.grade}`,
    `Accuracy: ${session.scores?.accuracyPct ?? 0}%`,
    `Number Sense: ${session.scores?.numberSense ?? 0}`,
    `Speed: ${session.scores?.speed ?? 0}`,
    `Concept: ${session.scores?.concept ?? 0}`,
    `Application: ${session.scores?.application ?? 0}`,
    `Confidence Index: ${session.scores?.confidenceIndex ?? 0}`,
    `Summary: ${session.summary ?? ''}`,
    `Recommendations: ${(session.recommendations || []).join(', ')}`,
  ].join('\n');
}
