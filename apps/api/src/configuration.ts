export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  if (config['NODE_ENV'] !== 'production') return config;

  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'ADMIN_PASSWORD', 'WEB_ORIGIN'];
  for (const key of required) {
    if (typeof config[key] !== 'string' || String(config[key]).length === 0) {
      throw new Error(`${key} is required in production`);
    }
  }
  if (String(config['JWT_SECRET']).length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production');
  }
  if (String(config['ADMIN_PASSWORD']).length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters in production');
  }
  return config;
}

export function authSecret(value: string | undefined, name: 'JWT_SECRET' | 'ADMIN_PASSWORD'): string {
  if (value) return value;
  if (process.env.NODE_ENV === 'production') throw new Error(`${name} is required in production`);
  return name === 'JWT_SECRET' ? 'default-secret-key-for-dev-only' : 'admin';
}
