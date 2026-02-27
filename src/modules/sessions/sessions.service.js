import crypto from 'node:crypto';
import { store } from '../../core/store.js';
import { getQuestionsForGrade } from './questionBank.js';
import { getNextDifficulty } from '../adaptive/adaptive.engine.js';
import { scoreExplanation } from '../explanations/nlp.scorer.js';
import { computeAnalytics } from '../analytics/analytics.service.js';
import { generateRecommendation, generateSummary } from '../recommendations/recommendation.engine.js';

const liveEvents = new Map();

function addEvent(sessionId, event) {
  const arr = liveEvents.get(sessionId) || [];
  arr.push({ ts: Date.now(), ...event });
  liveEvents.set(sessionId, arr.slice(-100));
}

export function createSession({ studentName, grade, createdBy, organizationId }) {
  const questions = getQuestionsForGrade(grade).map((q, idx) => ({ ...q, id: `q-${idx + 1}` }));
  const id = crypto.randomUUID();
  const session = {
    id,
    studentName,
    grade,
    createdBy,
    organizationId,
    status: 'CREATED',
    currentIndex: 0,
    difficultyIndex: 5,
    difficultyProgression: [5],
    questions,
    answers: [],
    scores: null,
    summary: null,
    recommendations: [],
    createdAt: new Date().toISOString(),
  };
  store.sessions.set(id, session);
  addEvent(id, { type: 'session:created', sessionId: id });
  return session;
}

export function startSession(id) {
  const s = store.sessions.get(id);
  if (!s) throw new Error('Session not found');
  s.status = 'LIVE';
  s.startedAt = Date.now();
  addEvent(id, { type: 'session:started', questionId: s.questions[0]?.id });
  return s;
}

export function submitAnswer(id, payload) {
  const s = store.sessions.get(id);
  if (!s || s.status !== 'LIVE') throw new Error('Session not live');
  const q = s.questions[s.currentIndex];
  if (!q) throw new Error('No active question');
  const answerText = String(payload.answer ?? '').trim();
  const correct = answerText === String(q.a);
  const timeMs = Number(payload.timeMs || 0);
  const explanation = payload.explanation || '';
  const explanationScore = q.needsExplanation ? scoreExplanation(explanation) : null;
  const answer = { questionId: q.id, round: q.round, answerText, correct, timeMs, explanation, explanationScore };
  s.answers.push(answer);

  s.difficultyIndex = getNextDifficulty(s.difficultyIndex, s.answers.map((a) => ({ correct: a.correct, timeMs: a.timeMs })));
  s.difficultyProgression.push(s.difficultyIndex);
  s.currentIndex += 1;

  const done = s.currentIndex >= s.questions.length;
  if (done) {
    s.status = 'COMPLETED';
    s.scores = computeAnalytics(s.answers);
    s.summary = generateSummary(s.scores);
    s.recommendations = generateRecommendation(s.scores);
  }

  addEvent(id, { type: 'answer:submitted', correct, nextQuestionId: s.questions[s.currentIndex]?.id, done });

  return {
    correct,
    done,
    difficultyIndex: s.difficultyIndex,
    nextQuestion: done ? null : publicQuestion(s.questions[s.currentIndex]),
    scores: done ? s.scores : null,
    summary: done ? s.summary : null,
    recommendations: done ? s.recommendations : [],
  };
}

export function publicQuestion(q) {
  if (!q) return null;
  return { id: q.id, q: q.q, round: q.round, type: q.type, needsExplanation: !!q.needsExplanation };
}

export function getSession(id, organizationId) {
  const s = store.sessions.get(id);
  if (!s || s.organizationId !== organizationId) return null;
  return s;
}

export function listSessions(organizationId) {
  return [...store.sessions.values()].filter((s) => s.organizationId === organizationId);
}

export function getSessionEvents(id) {
  return liveEvents.get(id) || [];
}
