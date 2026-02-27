export const env = {
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  TOKEN_TTL_SECONDS: Number(process.env.TOKEN_TTL_SECONDS || 60 * 60 * 8),
};
