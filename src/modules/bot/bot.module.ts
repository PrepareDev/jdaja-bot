import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotCommands } from './bot.commands';
import { OzonParser } from '../services/ozon-parser/ozon-parser.service';
import { FormatterService } from '../services/formatter/formatter.service';
import { GramjsService } from '../services/gramjs/gramjs.service';
import { TelegramClient } from 'telegram';
import { TaskModule } from '../tasks/tasks.module';
import { BotService } from './bot.service';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        token: config.getOrThrow<string>('BOT_TOKEN'),
      }),
    }),
    TaskModule,
  ],
  // Commands
  providers: [
    BotCommands,
    OzonParser,
    FormatterService,
    GramjsService,
    BotService,
  ],
})
export class BotModule {}
