import { hashPassword } from '../utils/hash.js';

const users = [
  {
    id: 'u1',
    role: 'COUNSELLOR',
    name: 'Counsellor Demo',
    email: 'counsellor@demo.com',
    organizationId: 'org-1',
    passwordHash: hashPassword('password123'),
  },
  {
    id: 'u2',
    role: 'ADMIN',
    name: 'Admin Demo',
    email: 'admin@demo.com',
    organizationId: 'org-1',
    passwordHash: hashPassword('password123'),
  },
];

const sessions = new Map();

export const store = {
  users,
  sessions,
};
