import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

type PostgresDataSourceOptions = Extract<
  DataSourceOptions,
  { type: 'postgres' }
>;

export type DatabaseEnv = Record<string, string | undefined>;

export function validateDatabaseEnv<T extends Record<string, unknown>>(
  config: T,
): T {
  buildDataSourceOptions(config as DatabaseEnv);
  return config;
}

export function buildDataSourceOptions(
  env: DatabaseEnv,
): PostgresDataSourceOptions {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not defined. Copy .env.example to .env and fill it in.',
    );
  }

  const useSsl = (env.DATABASE_SSL ?? 'true') !== 'false';

  return {
    type: 'postgres',
    url,
    schema: env.DATABASE_SCHEMA || 'public',
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    entities: [join(__dirname, '..', 'entities', '*.orm-entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
  };
}
