import { Command, Ctx, Update } from 'nestjs-telegraf';
import { OzonParser } from '../services/ozon-parser/ozon-parser.service';
import { Context } from 'telegraf';
import { CommandContextExtn } from 'telegraf/typings/telegram-types';
import isValidUrl from '../common/helpers/is-valid-url.helper';
import { FormatterService } from '../services/formatter/formatter.service';
import { Logger } from '@nestjs/common';
import { GramjsService } from '../services/gramjs/gramjs.service';

@Update()
export class BotCommands {
  protected logger = new Logger(BotCommands.name);
  constructor(
    private readonly ozonParser: OzonParser,
    private readonly formatter: FormatterService,
    private readonly gram: GramjsService
  ) {}
  @Command("all")
  public async all(@Ctx() ctx: Context & CommandContextExtn){
    if (!ctx.chat){
      await ctx.sendMessage("BYE BYE TUTUUTTUUTTU")
    }
    const users = await this.gram.getChatMembers(String(ctx.message?.chat.id))
    const msg = users.join(" ")

    await ctx.sendMessage(msg, {
      message_thread_id:ctx.message?.message_thread_id
    })

  }
  
  @Command('book')
  public async parseBook(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const url = ctx.payload;
      if (!isValidUrl(url)) {
        ctx.reply('Нужно ввести валидный URL для книги');
      }

      const msg = await ctx.sendMessage('Собираю информацию по книге...');

      const book = await this.ozonParser.parseBook(url);

      await ctx.deleteMessages([msg.message_id, ctx.message!.message_id]);

      const markdown = this.formatter.formatBookResponse(book);

      await ctx.sendPhoto(
        { url: book.image },
        {
          caption: markdown,
          parse_mode: 'Markdown',
        },
      );
    } catch (e) {
      this.logger.error(e);
      ctx.reply(`ПИЗДЕЕЕЕЕЕЕЕЕЕЕЕЕЕЕЦ!!!!! ${String(e)}`);
    }
  }
}