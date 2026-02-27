import { parseJson, sendJson } from '../../core/http.js';
import { login } from './auth.service.js';

export async function loginHandler(req, res) {
  try {
    const body = await parseJson(req);
    const result = login(body.email, body.password);
    if (!result) return sendJson(res, 401, { error: 'Invalid credentials' });
    return sendJson(res, 200, result);
  } catch {
    return sendJson(res, 400, { error: 'Invalid request body' });
  }
}
