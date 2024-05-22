import { Injectable } from '@nestjs/common';
import { SelectTask } from '../tasks/drizzle.schema';

@Injectable()
export class BotService {
  public parseFlags(payload: string) {
    const flags: Record<string, string> = {};
    payload
      .split(' ')
      .map((option) => option.split(':'))
      .forEach(([k, v]) => {
        flags[k] = v;
      });
    return flags;
  }

  public formatTasks(tasks: SelectTask[]) {
    return (
      'Tasks\n' +
      tasks.map((t) => `${t.id}. ${t.title} - STATUS: ${t.status}`).join('\n')
    );
  }
}
