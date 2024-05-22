import { DrizzleTursoModule } from '@knaadh/nestjs-drizzle-turso';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as schema from './drizzle.schema';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    DrizzleTursoModule.registerAsync({
      tag: 'DB',
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          turso: {
            config: {
              url: config.getOrThrow('TURSO_URL'),
              authToken: config.getOrThrow('TURSO_AUTH_TOKEN'),
            },
          },
          config: { schema: { ...schema } },
        };
      },
    }),
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TaskModule {}
