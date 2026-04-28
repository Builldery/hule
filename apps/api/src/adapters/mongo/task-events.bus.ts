import { EventEmitter } from 'node:events';

export interface TaskAfterUpdateEvent {
  workspaceId: string;
  before: Record<string, any> | null;
  after: Record<string, any>;
  isBulk: boolean;
}

export type TaskEventName = 'task.after-update';

class TaskEventsBus extends EventEmitter {
  emitAfterUpdate(payload: TaskAfterUpdateEvent): void {
    this.emit('task.after-update', payload);
  }
}

export const taskEventsBus = new TaskEventsBus();
taskEventsBus.setMaxListeners(50);
