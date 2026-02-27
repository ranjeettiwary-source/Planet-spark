import { verifyToken } from '../../utils/token.js';
import { env } from '../../config/env.js';

export function requireAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new Error('Missing token');
  return verifyToken(token, env.JWT_SECRET);
}

export function requireRole(claims, allowedRoles) {
  if (!allowedRoles.includes(claims.role)) throw new Error('Forbidden');
}
