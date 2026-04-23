import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class CommentAttachment {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId })
  fileId: mongoose.Types.ObjectId;

  @Prop({ required: true }) filename: string;
  @Prop({ required: true }) mime: string;
  @Prop({ required: true }) size: number;
}

export const CommentAttachmentSchema =
  SchemaFactory.createForClass(CommentAttachment);

@Schema({
  collection: 'comments',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Comment {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Task' })
  taskId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['comment', 'activity'], default: 'comment' })
  kind: 'comment' | 'activity';

  @Prop() body?: string;

  @Prop({ type: { type: { type: String }, meta: mongoose.Schema.Types.Mixed }, _id: false })
  activity?: { type: string; meta: unknown };

  @Prop({ type: [CommentAttachmentSchema], default: [] })
  attachments: Array<CommentAttachment>;
}

export type CommentDocument = Comment & Document;
export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ taskId: 1, createdAt: 1 });
