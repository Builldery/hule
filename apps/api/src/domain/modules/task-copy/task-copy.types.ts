import { Types } from 'mongoose';
import { ETaskPriority } from '../../entity/task/task.constants';

export interface SourceNode {
  sourceId: Types.ObjectId;
  parentSourceId: Types.ObjectId | null;
  sourcePath: Array<Types.ObjectId>;
  sourceDepth: number;
  order: number;

  workspaceId: Types.ObjectId;
  title: string;
  description?: string;
  status: string;
  priority: ETaskPriority;
  startDate?: Date;
  dueDate?: Date;
  assigneeId: Types.ObjectId | null;
  tagIds: Array<Types.ObjectId>;
  timeEstimate?: number;
  trackedTime?: number;
}

export interface SourceComment {
  sourceTaskId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  kind: 'comment' | 'activity';
  body?: string;
  activity?: { type: string; meta: unknown };
  createdAt: Date;
}

export interface SourceTree {
  rootSourceId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  nodes: Array<SourceNode>;
  comments: Array<SourceComment>;
}

export interface CopyOptions {
  targetWorkspaceId: Types.ObjectId;
  targetListId: Types.ObjectId;
  targetParentId: Types.ObjectId | null;
  rootOrder?: number;

  withSubtasks: boolean;
  withComments: boolean;

  setStatus?: string;
  setDates?: { startDate?: Date | null; dueDate?: Date | null };

  resetTrackedTime: boolean;
  resetAssignee: boolean;

  spawnedFromTemplateRootId?: Types.ObjectId;
}

export interface PlannedTask {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  listId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  path: Array<Types.ObjectId>;
  depth: number;
  order: number;
  title: string;
  description?: string;
  status: string;
  priority: ETaskPriority;
  startDate?: Date;
  dueDate?: Date;
  assigneeId: Types.ObjectId | null;
  tagIds: Array<Types.ObjectId>;
  timeEstimate?: number;
  trackedTime?: number;
  spawnedFromTemplateId: Types.ObjectId | null;
}

export interface PlannedComment {
  workspaceId: Types.ObjectId;
  taskId: Types.ObjectId;
  kind: 'comment' | 'activity';
  body?: string;
  activity?: { type: string; meta: unknown };
  attachments: [];
  createdAt: Date;
}

export interface CopyPlan {
  source: SourceTree;
  options: CopyOptions;
  idMap: Map<string, Types.ObjectId>;
  targetParentPath: Array<Types.ObjectId>;
  plannedTasks: Array<PlannedTask>;
  plannedComments: Array<PlannedComment>;
  resultRootId: Types.ObjectId | null;
}
