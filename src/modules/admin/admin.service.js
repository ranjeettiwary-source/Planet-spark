import { listSessions } from '../sessions/sessions.service.js';

export function getOverview(organizationId) {
  const sessions = listSessions(organizationId);
  const byCounsellor = new Map();
  for (const s of sessions) {
    const curr = byCounsellor.get(s.createdBy) || { counsellorId: s.createdBy, totalSessions: 0, avgConfidence: 0 };
    curr.totalSessions += 1;
    curr.avgConfidence += s.scores?.confidenceIndex || 0;
    byCounsellor.set(s.createdBy, curr);
  }
  const counsellors = [...byCounsellor.values()].map((c) => ({ ...c, avgConfidence: c.totalSessions ? Math.round(c.avgConfidence / c.totalSessions) : 0 }));
  const closurePredictionIndex = counsellors.length ? Math.round(counsellors.reduce((a, c) => a + c.avgConfidence, 0) / counsellors.length) : 0;
  return {
    totalSessions: sessions.length,
    closurePredictionIndex,
    counsellors,
  };
}
