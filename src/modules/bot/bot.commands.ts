import { Command, Ctx, Update } from 'nestjs-telegraf';
import { OzonParser } from '../services/ozon-parser/ozon-parser.service';
import { Context } from 'telegraf';
import { CommandContextExtn } from 'telegraf/typings/telegram-types';
import isValidUrl from '../common/helpers/is-valid-url.helper';
import { FormatterService } from '../services/formatter/formatter.service';
import { Logger } from '@nestjs/common';
import { GramjsService } from '../services/gramjs/gramjs.service';
import { TasksService } from '../tasks/tasks.service';
import { BotService } from './bot.service';

@Update()
export class BotCommands {
  protected logger = new Logger(BotCommands.name);
  constructor(
    private readonly ozonParser: OzonParser,
    private readonly formatter: FormatterService,
    private readonly gram: GramjsService,
    private readonly taskService: TasksService,
    private readonly service: BotService,
  ) {}
  @Command('all')
  public async all(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      if (!ctx.chat) {
        await ctx.sendMessage('BYE BYE TUTUUTTUUTTU');
      }
      const users = await this.gram.getChatMembers(
        String(ctx.message?.chat.id),
      );
      const msg = users.join(' ');

      await ctx.sendMessage(msg, {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[All] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage('Error while executing command /all. Check logs');
    }
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
      this.logger.error(`[ParseBook] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage('Error while executing command /book. Check logs');
    }
  }

  @Command('tasks')
  public async getAllTasks(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));

      const tasks = await this.taskService.getTasks(
        ctx.from!.username ?? ctx.from!.first_name,
        {
          status: flags['status'] as any,
        },
      );

      if (tasks.length === 0) {
        await ctx.sendMessage('No active tasks', {
          message_thread_id: ctx.message?.message_thread_id,
        });
        return;
      }

      await ctx.sendMessage(this.service.formatTasks(tasks), {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[GetAllTasks] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage('Error while executing command /tasks. Check logs');
    }
  }

  @Command('addTask')
  public async addTask(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));

      if (!flags?.title) {
        await ctx.sendMessage(
          'You should provide title flag\nUSAGE: /addTask title:TITLE',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
        return;
      }

      const createdTask = await this.taskService.addTask(
        flags.title,
        ctx.from!.username ?? ctx.from!.first_name,
        flags['project_id'] as any,
      );

      await ctx.sendMessage('Task with id ' + createdTask.id + ' created', {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[AddTask] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /addTask. Check logs',
      );
    }
  }

  @Command('assign')
  public async assignTask(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));

      if (!flags?.taskId || !flags?.to) {
        await ctx.sendMessage(
          'You should provide `taskId`, and `to` flags\nUSAGE: /assign taskId:TASK_ID to:@USERNAME',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
        return;
      }
      await this.taskService.assignUser(
        parseInt(flags.taskId),
        flags.to,
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage(`Assigned task ${flags.taskId} to ${flags.to}`, {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[AssignTask] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /assign. Check logs',
      );
    }
  }

  @Command('addToProject')
  public async assignTaskToProject(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));
      if (!flags.taskId || !flags.projectId) {
        await ctx.sendMessage(
          'You should provide `taskId`, and `projectId` flags\nUSAGE: /addToProject taskId:TASK_ID projectId:PROJECT_ID',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
      }
    } catch (e) {
      this.logger.error(
        `[AssignTaskToProject] Message: ${ctx.text}\nError: ${e}`,
      );
      await ctx.sendMessage(
        'Error while executing command /addToProject. Check logs',
        { message_thread_id: ctx.message?.message_thread_id },
      );
    }
  }

  @Command('projects')
  public async getProjects(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const projects = await this.taskService.getProjects(
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage(this.service.formatProjects(projects));
    } catch (e) {
      this.logger.error(`[GetProjects] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /projects. Check logs',
        { message_thread_id: ctx.message?.message_thread_id },
      );
    }
  }

  @Command('myTasks')
  public async getMyTasks(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));

      const userTasks = await this.taskService.getTasksByAssignee(
        '@' + (ctx.from!.username ?? ctx.from!.first_name),
        { status: flags?.status as any },
      );
      if (userTasks.length === 0) {
        await ctx.sendMessage('No tasks you assigned to', {
          message_thread_id: ctx.message?.message_thread_id,
        });
        return;
      }
      await ctx.sendMessage(this.service.formatTasks(userTasks), {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[MyTasks] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /myTasks. Check logs',
      );
    }
  }

  @Command('deleteTask')
  public async deleteTask(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));
      if (!flags?.id) {
        await ctx.sendMessage(
          'You should provide `id` flag\nUSAGE: /deleteTask id:TASK_ID',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
        return;
      }
      await this.taskService.deleteTask(
        parseInt(flags.id),
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage('Task deleted', {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[DeleteTask] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /deleteTask. Check logs',
      );
    }
  }

  @Command('updateStatus')
  public async updateTaskStatus(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));
      if (!flags?.taskId || !flags?.status) {
        await ctx.sendMessage(
          'You should provide `taskId` flag\nUSAGE: /updateStatus taskId:TASK_ID status:NEW_STATUS',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
        return;
      }
      await this.taskService.updateStatus(
        parseInt(flags.taskId),
        flags.status as any,
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage('Status Updated', {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[UpdateStatus] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /updateStatus. Check logs',
        { message_thread_id: ctx.message?.message_thread_id },
      );
    }
  }

  @Command('finish')
  public async finishTask(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));
      if (!flags?.taskId || !flags?.status) {
        await ctx.sendMessage(
          'You should provide `taskId` flag\nUSAGE: /finish taskId:TASK_ID',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
        return;
      }
      await this.taskService.updateStatus(
        parseInt(flags.taskId),
        'FINISHED',
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage('Status Updated', {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[FinishTask] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /finish. Check logs',
        { message_thread_id: ctx.message?.message_thread_id },
      );
    }
  }

  @Command('workOn')
  public async workOnTask(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const flags = this.service.parseFlags(ctx.payload.split(' '));
      if (!flags?.taskId || !flags?.status) {
        await ctx.sendMessage(
          'You should provide `taskId` flag\nUSAGE: /workOn taskId:TASK_ID',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
        return;
      }
      await this.taskService.updateStatus(
        parseInt(flags.taskId),
        'IN_PROGRESS',
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage('Status Updated', {
        message_thread_id: ctx.message?.message_thread_id,
      });
    } catch (e) {
      this.logger.error(`[WorkOnTask] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /workOn. Check logs',
        { message_thread_id: ctx.message?.message_thread_id },
      );
    }
  }

  @Command('addProject')
  public async addProject(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      const payload = ctx.payload.trim();
      if (payload.length < 1) {
        await ctx.sendMessage(
          'You should provide `title` as positional argument\nUSAGE: /addProject TITLE',
          {
            message_thread_id: ctx.message?.message_thread_id,
          },
        );
      }
      const project = await this.taskService.addProject(
        payload,
        ctx.from!.username ?? ctx.from!.first_name,
      );
      await ctx.sendMessage('Project with id: ' + project.id + ' created.');
    } catch (e) {
      this.logger.error(`[AddProject] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage(
        'Error while executing command /addProject. Check logs',
        { message_thread_id: ctx.message?.message_thread_id },
      );
    }
  }

  @Command('help')
  public async help(@Ctx() ctx: Context & CommandContextExtn) {
    try {
      await ctx.sendMessage(`HELP:
/all - Тегнуть всех юзеров в чате,
/book OZON_LINK - отправить информацию о книге в красивом виде,

TASKS:
STATUS: FINISHED | TODO | IN_PROGRESS

/addProject title:STRING - добавить проект
/tasks [status:STATUS] - Получить все задачи
/myTasks [status:STATUS] - Получить все задачи, где ты исполнитель
/assign taskId:NUMBER to:USERNAME - Назначить задачу на USERNAME
/addTask title:STRING [project_id:NUMBER] - добавить задачу
/deleteTask id:NUMBER - удалить задачу
/updateStatus taskId:NUMBER status:STATUS - обновить статус задачи
/finish taskId:NUMBER - завершить задачу
/workOn taskId:NUMBER - взять задачу в работу
/projects - Получить список проектов
/addToProject taskId:NUMBER projectId:NUMBER - Добавить задачу в проект
`);
    } catch (e) {
      this.logger.error(`[HELP] Message: ${ctx.text}\nError: ${e}`);
      await ctx.sendMessage('Error while executing command /help. Check logs');
    }
  }
}
