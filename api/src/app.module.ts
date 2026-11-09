import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateDatabaseEnv } from './infrastructure/database/database.config';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateDatabaseEnv }),
    DatabaseModule,
  ],
})
export class AppModule {}
