import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ERecurrenceKind } from '../../domain/entity/recurring-job/recurring-job.constants';

@Schema({ collection: 'recurring_jobs', timestamps: true })
export class RecurringJob {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Space' })
  spaceId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'TaskTemplate' })
  templateId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'List' })
  targetListId: mongoose.Types.ObjectId;

  @Prop({ required: true }) name: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ERecurrenceKind),
  })
  kind: ERecurrenceKind;

  @Prop({ required: true }) timeOfDay: string;

  @Prop({ type: Number, min: 1, max: 7 }) weekday?: number;
  @Prop({ type: Number, min: 1, max: 31 }) monthDay?: number;
  @Prop({ type: Number, min: 1, max: 12 }) monthOfYear?: number;

  @Prop({ required: true, default: true }) active: boolean;
  @Prop({ required: true, type: Date }) nextRunAt: Date;
  @Prop({ type: Date, default: null }) lastRunAt: Date | null;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  })
  lastSpawnedTaskId: mongoose.Types.ObjectId | null;
}

export type RecurringJobDocument = RecurringJob & Document;
export const RecurringJobSchema = SchemaFactory.createForClass(RecurringJob);

RecurringJobSchema.index({ active: 1, nextRunAt: 1 });
RecurringJobSchema.index({ workspaceId: 1 });
RecurringJobSchema.index({ templateId: 1 });
