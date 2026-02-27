import crypto from 'node:crypto';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function unb64url(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signToken(payload, secret, ttlSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (signature !== expected) throw new Error('Invalid signature');
  const decoded = JSON.parse(unb64url(payload));
  if (decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return decoded;
}
