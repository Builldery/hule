import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ETaskPriority } from '../../domain/entity/task/task.constants';

@Schema({ collection: 'task_templates', timestamps: true })
export class TaskTemplate {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Space' })
  spaceId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TaskTemplate', default: null })
  parentId: mongoose.Types.ObjectId | null;

  @Prop({ required: true }) title: string;
  @Prop() description?: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ETaskPriority),
    default: ETaskPriority.None,
  })
  priority: ETaskPriority;

  @Prop({ required: true, default: 0 }) order: number;
  @Prop({ required: true, default: 0 }) depth: number;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskTemplate' }],
    default: [],
  })
  path: Array<mongoose.Types.ObjectId>;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    default: [],
  })
  tagIds: Array<mongoose.Types.ObjectId>;

  @Prop({ type: Number, min: 0 }) timeEstimate?: number;
}

export type TaskTemplateDocument = TaskTemplate & Document;
export const TaskTemplateSchema = SchemaFactory.createForClass(TaskTemplate);

TaskTemplateSchema.index({ spaceId: 1, parentId: 1, order: 1 });
TaskTemplateSchema.index({ parentId: 1 });
TaskTemplateSchema.index({ path: 1 });
TaskTemplateSchema.index({ workspaceId: 1 });
TaskTemplateSchema.index({ tagIds: 1 });
