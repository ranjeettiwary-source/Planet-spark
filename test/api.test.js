import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

async function jsonReq(base, path, method, token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const isText = res.headers.get('content-type')?.includes('text/plain');
  const data = isText ? await res.text() : await res.json();
  return { status: res.status, data };
}

test('complete counsellor session flow with analytics and report', async () => {
  const server = createApp();
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const login = await jsonReq(base, '/api/v1/auth/login', 'POST', null, { email: 'counsellor@demo.com', password: 'password123' });
  assert.equal(login.status, 200);
  const token = login.data.token;

  const create = await jsonReq(base, '/api/v1/sessions', 'POST', token, { studentName: 'Aarav', grade: 'G5' });
  assert.equal(create.status, 201);
  const id = create.data.sessionId;

  const start = await jsonReq(base, `/api/v1/sessions/${id}/start`, 'POST', token, {});
  assert.equal(start.status, 200);

  // submit 10 answers to complete
  const answers = ['30', '9', '43', '56', '6', '28', '40', '30', '9801', '1000'];
  for (const a of answers) {
    const resp = await jsonReq(base, `/api/v1/sessions/${id}/answer`, 'POST', token, {
      answer: a,
      timeMs: 5000,
      explanation: 'First I compute the sum because it is a factor relation therefore valid',
    });
    assert.equal(resp.status, 200);
  }

  const report = await jsonReq(base, `/api/v1/reports/${id}`, 'GET', token);
  assert.equal(report.status, 200);
  assert.ok(report.data.scores.confidenceIndex >= 0);
  assert.ok(Array.isArray(report.data.recommendations));

  const pdf = await jsonReq(base, `/api/v1/reports/${id}/pdf`, 'GET', token);
  assert.equal(pdf.status, 200);
  assert.match(pdf.data, /Math Rapid Fire Pro - Session Report/);

  server.close();
});

test('admin overview is protected and available for admin role', async () => {
  const server = createApp();
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const cLogin = await jsonReq(base, '/api/v1/auth/login', 'POST', null, { email: 'counsellor@demo.com', password: 'password123' });
  const denied = await jsonReq(base, '/api/v1/admin/overview', 'GET', cLogin.data.token);
  assert.equal(denied.status, 403);

  const aLogin = await jsonReq(base, '/api/v1/auth/login', 'POST', null, { email: 'admin@demo.com', password: 'password123' });
  const allowed = await jsonReq(base, '/api/v1/admin/overview', 'GET', aLogin.data.token);
  assert.equal(allowed.status, 200);
  assert.ok('totalSessions' in allowed.data);

  server.close();
});
