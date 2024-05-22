import { Inject, Injectable, Logger } from '@nestjs/common';
import * as schema from './drizzle.schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { and, eq, SQL } from 'drizzle-orm';

@Injectable()
export class TasksService {
  protected logger = new Logger(TasksService.name);
  constructor(
    @Inject('DB') private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  public getTasks(
    by: string,
    filters?: { status: schema.InsertTask['status'] },
  ) {
    this.logger.log(
      `[GetTasks] { by: ${by}, filters: { status: ${filters?.status} } }`,
    );
    const conditions: SQL<unknown>[] = [];
    if (filters?.status) {
      conditions.push(eq(schema.taskTable.status, filters.status));
    }
    return this.db.query.taskTable.findMany({
      where: and(...conditions),
    });
  }

  public getProjectTasks(
    projectId: number,
    by: string,
    filters?: {
      status: schema.InsertTask['status'];
    },
  ) {
    this.logger.log(
      `[GetProjectTasks] { projectId: ${projectId}, by: ${by}, filters: { status: ${filters?.status} } }`,
    );
    const conditions = [eq(schema.taskTable.projectId, projectId)];
    if (filters?.status) {
      conditions.push(eq(schema.taskTable.status, filters.status));
    }
    return this.db.query.taskTable.findMany({
      where: and(...conditions),
    });
  }

  public getProjects(by: string) {
    this.logger.log(`[GetProjects] { by: ${by} }`);
    return this.db.query.projectTable.findMany();
  }

  public addToProject(taskId: number, projectId: number, by: string) {
    this.logger.log(
      `[AddToProject] { taskId: ${taskId}, projectId: ${taskId}, by: ${by} }`,
    );
    return this.db
      .update(schema.taskTable)
      .set({ projectId })
      .where(eq(schema.taskTable.id, taskId));
  }

  public getTasksByAssignee(
    username: string,
    filters?: {
      status: schema.InsertTask['status'];
    },
  ) {
    this.logger.log(`[GetTaskByAssignee] For: ${username}`);
    const conditions = [eq(schema.taskTable.assignedUser, username)];
    if (filters?.status) {
      conditions.push(eq(schema.taskTable.status, filters.status));
    }
    return this.db.query.taskTable.findMany({
      where: and(...conditions),
    });
  }

  public addTask(newTaskTitle: string, username: string, projectId?: number) {
    this.logger.log(
      `[AddTask] { title: ${newTaskTitle}, username: ${username}, projectId: ${projectId}, by: ${username} }`,
    );
    return this.db
      .insert(schema.taskTable)
      .values({
        title: newTaskTitle,
        createdBy: username,
        projectId,
        status: 'TODO',
      })
      .returning()
      .then(([t]) => t);
  }

  public assignUser(taskId: number, assignee: string, by: string) {
    this.logger.log(
      `[AssignUser] { taskId: ${taskId}, to: ${assignee}, by: ${by} }`,
    );
    return this.db
      .update(schema.taskTable)
      .set({ assignedUser: assignee })
      .where(eq(schema.taskTable.id, taskId));
  }

  public deleteTask(taskId: number, by: string) {
    this.logger.log(`[DeleteTask] { taskId: ${taskId}, by: ${by} }`);
    return this.db
      .delete(schema.taskTable)
      .where(eq(schema.taskTable.id, taskId));
  }

  public updateStatus(
    taskId: number,
    newStatus: schema.InsertTask['status'],
    by: string,
  ) {
    this.logger.log(
      `[UpdateStatus] { taskId: ${taskId}, newStatus: ${newStatus}, by: ${by} }`,
    );
    return this.db
      .update(schema.taskTable)
      .set({ status: newStatus })
      .where(eq(schema.taskTable.id, taskId));
  }

  public addProject(title: string, by: string) {
    this.logger.log(`[AddProject] { title: ${title}, by: ${by} }`);
    return this.db
      .insert(schema.projectTable)
      .values({ title: title })
      .returning()
      .then(([p]) => p);
  }
}
