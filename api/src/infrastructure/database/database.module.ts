import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions({
          DATABASE_URL: config.get<string>('DATABASE_URL'),
          DATABASE_SSL: config.get<string>('DATABASE_SSL'),
          DATABASE_SCHEMA: config.get<string>('DATABASE_SCHEMA'),
        }),
    }),
  ],
})
export class DatabaseModule {}
