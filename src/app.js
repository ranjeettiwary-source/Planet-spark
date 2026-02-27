import http from 'node:http';
import { sendJson, notFound, parseJson } from './core/http.js';
import { loginHandler } from './modules/auth/auth.controller.js';
import { requireAuth, requireRole } from './modules/auth/auth.middleware.js';
import { createSession, startSession, submitAnswer, getSession, publicQuestion, listSessions, getSessionEvents } from './modules/sessions/sessions.service.js';
import { buildReportText } from './modules/reports/pdf.service.js';
import { getOverview } from './modules/admin/admin.service.js';

function routeMatch(pathname, pattern) {
  const p1 = pathname.split('/').filter(Boolean);
  const p2 = pattern.split('/').filter(Boolean);
  if (p1.length !== p2.length) return null;
  const params = {};
  for (let i = 0; i < p2.length; i += 1) {
    if (p2[i].startsWith(':')) params[p2[i].slice(1)] = p1[i];
    else if (p1[i] !== p2[i]) return null;
  }
  return params;
}

export function createApp() {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/healthz') return sendJson(res, 200, { status: 'ok' });
    if (req.method === 'POST' && pathname === '/api/v1/auth/login') return loginHandler(req, res);

    try {
      const claims = requireAuth(req);

      if (req.method === 'POST' && pathname === '/api/v1/sessions') {
        requireRole(claims, ['COUNSELLOR']);
        const body = await parseJson(req);
        if (!body.studentName || !body.grade) return sendJson(res, 400, { error: 'studentName and grade required' });
        const session = createSession({ studentName: body.studentName, grade: body.grade, createdBy: claims.sub, organizationId: claims.organizationId });
        return sendJson(res, 201, { sessionId: session.id, firstQuestion: publicQuestion(session.questions[0]) });
      }

      const startParams = routeMatch(pathname, '/api/v1/sessions/:id/start');
      if (req.method === 'POST' && startParams) {
        requireRole(claims, ['COUNSELLOR']);
        const session = startSession(startParams.id);
        return sendJson(res, 200, { status: session.status, question: publicQuestion(session.questions[session.currentIndex]) });
      }

      const answerParams = routeMatch(pathname, '/api/v1/sessions/:id/answer');
      if (req.method === 'POST' && answerParams) {
        requireRole(claims, ['COUNSELLOR']);
        const body = await parseJson(req);
        return sendJson(res, 200, submitAnswer(answerParams.id, body));
      }

      const sessionParams = routeMatch(pathname, '/api/v1/sessions/:id');
      if (req.method === 'GET' && sessionParams) {
        const session = getSession(sessionParams.id, claims.organizationId);
        if (!session) return sendJson(res, 404, { error: 'Session not found' });
        return sendJson(res, 200, session);
      }

      if (req.method === 'GET' && pathname === '/api/v1/sessions') {
        return sendJson(res, 200, listSessions(claims.organizationId));
      }

      const reportParams = routeMatch(pathname, '/api/v1/reports/:id');
      if (req.method === 'GET' && reportParams) {
        const session = getSession(reportParams.id, claims.organizationId);
        if (!session) return sendJson(res, 404, { error: 'Session not found' });
        return sendJson(res, 200, { scores: session.scores, summary: session.summary, recommendations: session.recommendations });
      }

      const reportPdfParams = routeMatch(pathname, '/api/v1/reports/:id/pdf');
      if (req.method === 'GET' && reportPdfParams) {
        const session = getSession(reportPdfParams.id, claims.organizationId);
        if (!session) return sendJson(res, 404, { error: 'Session not found' });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(buildReportText(session));
        return;
      }

      const eventsParams = routeMatch(pathname, '/api/v1/sessions/:id/events');
      if (req.method === 'GET' && eventsParams) {
        return sendJson(res, 200, getSessionEvents(eventsParams.id));
      }

      if (req.method === 'GET' && pathname === '/api/v1/admin/overview') {
        requireRole(claims, ['ADMIN']);
        return sendJson(res, 200, getOverview(claims.organizationId));
      }

      return notFound(res);
    } catch (e) {
      const message = e.message === 'Forbidden' ? 'Forbidden' : 'Unauthorized';
      const code = e.message === 'Forbidden' ? 403 : 401;
      return sendJson(res, code, { error: message });
    }
  });
}
