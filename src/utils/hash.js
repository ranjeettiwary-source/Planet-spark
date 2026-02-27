import crypto from 'node:crypto';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${digest}`;
}

export function verifyPassword(password, hash) {
  const [salt, digest] = hash.split(':');
  const newDigest = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(newDigest, 'hex'));
}
