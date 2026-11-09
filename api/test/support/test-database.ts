import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../../src/infrastructure/database/database.config';

/**
 * Loads the test environment and forces a dedicated schema so the tests never
 * touch the application's data. Defaults to the "test" schema; override it with
 * TEST_DATABASE_SCHEMA. Variables from .env.test take precedence over .env.
 */
export function loadTestEnv(): void {
  for (const file of ['.env.test', '.env']) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
    }
  }

  const schema = process.env.TEST_DATABASE_SCHEMA ?? 'test';
  if (schema === 'public') {
    throw new Error(
      'Tests must not run against the "public" schema. Set TEST_DATABASE_SCHEMA to a dedicated schema.',
    );
  }
  process.env.DATABASE_SCHEMA = schema;
}

/** Creates the test schema (if needed), runs migrations and returns a connected DataSource. */
export async function prepareTestDatabase(): Promise<DataSource> {
  loadTestEnv();

  const options = buildDataSourceOptions(process.env);
  const dataSource = new DataSource(options);
  await dataSource.initialize();
  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${options.schema}"`);
  await dataSource.runMigrations();
  return dataSource;
}
