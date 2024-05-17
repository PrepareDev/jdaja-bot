import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './modules/bot/bot.module';

@Module({
  imports: [ConfigModule.forRoot(), BotModule],
})
export class AppModule {}
