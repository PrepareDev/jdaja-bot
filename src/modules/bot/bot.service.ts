import { Injectable } from '@nestjs/common';
import { SelectProject, SelectTask } from '../tasks/drizzle.schema';

@Injectable()
export class BotService {
  public parseFlags(args: string[]) {
    const flags: Record<string, string> = {};
    args
      .map((option) => option.split(':'))
      .forEach(([k, v]) => {
        flags[k] = v;
      });
    return flags;
  }

  public formatTasks(tasks: SelectTask[]) {
    return (
      'Tasks\n' +
      tasks
        .map(
          (t) =>
            `${t.id}. ${t.title} - STATUS: ${t.status} ASSIGNED: ${t.assignedUser?.slice(1)}`,
        )
        .join('\n')
    );
  }

  public formatProjects(projects: SelectProject[]) {
    return 'Projects\n' + projects.map((p) => `${p.id}. ${p.title}`).join('\n');
  }
}
