import { store } from '../../core/store.js';
import { verifyPassword } from '../../utils/hash.js';
import { signToken } from '../../utils/token.js';
import { env } from '../../config/env.js';

export function login(email, password) {
  const user = store.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }
  const token = signToken({ sub: user.id, role: user.role, organizationId: user.organizationId }, env.JWT_SECRET, env.TOKEN_TTL_SECONDS);
  return {
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email, organizationId: user.organizationId },
  };
}
