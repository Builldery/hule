import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ETaskPriority } from '../../domain/entity/task/task.constants';

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
}

export type TaskDocument = Task & Document;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ listId: 1, parentId: 1, order: 1 });
TaskSchema.index({ parentId: 1 });
TaskSchema.index({ path: 1 });
TaskSchema.index({ startDate: 1, dueDate: 1 });
TaskSchema.index({ assigneeId: 1 });
TaskSchema.index({ workspaceId: 1 });
