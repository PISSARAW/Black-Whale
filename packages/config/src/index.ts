/** Shared environment variable schema */
export const ENV_SCHEMA = {
  DATABASE_URL: { required: true, description: 'PostgreSQL connection string' },
  SESSION_SECRET: { required: true, description: 'Secret for session signing' },
  STORAGE_BUCKET: { required: false, description: 'S3 / R2 bucket name' },
  STORAGE_ENDPOINT: { required: false, description: 'S3 / R2 endpoint URL' },
  SEARCH_URL: { required: false, description: 'Meilisearch / OpenSearch URL' },
  SENTRY_DSN: { required: false, description: 'Sentry DSN' },
  NODE_ENV: { required: false, description: 'Environment name', default: 'development' },
} as const

export type EnvSchema = typeof ENV_SCHEMA
