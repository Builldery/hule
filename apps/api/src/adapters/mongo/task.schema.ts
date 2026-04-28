import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ETaskPriority } from '../../domain/entity/task/task.constants';
import { taskEventsBus } from './task-events.bus';
import { isBulk } from './dispatch-context';

@Schema({ collection: 'tasks', timestamps: true })
export class Task {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'List' })
  listId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null })
  parentId: mongoose.Types.ObjectId | null;

  @Prop({ required: true }) title: string;
  @Prop() description?: string;

  @Prop({ required: true, default: 'todo' }) status: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ETaskPriority),
    default: ETaskPriority.None,
  })
  priority: ETaskPriority;

  @Prop() startDate?: Date;
  @Prop() dueDate?: Date;

  @Prop({ required: true, default: 0 }) order: number;
  @Prop({ required: true, default: 0 }) depth: number;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    default: [],
  })
  path: Array<mongoose.Types.ObjectId>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  assigneeId: mongoose.Types.ObjectId | null;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    default: [],
  })
  tagIds: Array<mongoose.Types.ObjectId>;

  @Prop({ type: Number, min: 0 }) timeEstimate?: number;
  @Prop({ type: Number, min: 0 }) trackedTime?: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskTemplate',
    default: null,
  })
  spawnedFromTemplateId: mongoose.Types.ObjectId | null;
}

export type TaskDocument = Task & Document;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ listId: 1, parentId: 1, order: 1 });
TaskSchema.index({ parentId: 1 });
TaskSchema.index({ path: 1 });
TaskSchema.index({ startDate: 1, dueDate: 1 });
TaskSchema.index({ assigneeId: 1 });
TaskSchema.index({ workspaceId: 1 });
TaskSchema.index({ tagIds: 1 });
TaskSchema.index({ spawnedFromTemplateId: 1 });

TaskSchema.pre('findOneAndUpdate', async function () {
  const q = this as unknown as {
    model: mongoose.Model<unknown>;
    getQuery: () => Record<string, unknown>;
    _beforeDoc?: unknown;
  };
  q._beforeDoc = await q.model.findOne(q.getQuery()).lean();
});

TaskSchema.post('findOneAndUpdate', function (doc: any) {
  if (!doc) return;
  const q = this as unknown as { _beforeDoc?: any };
  const after = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  taskEventsBus.emitAfterUpdate({
    workspaceId: doc.workspaceId.toString(),
    before: q._beforeDoc ?? null,
    after,
    isBulk: isBulk(),
  });
});
