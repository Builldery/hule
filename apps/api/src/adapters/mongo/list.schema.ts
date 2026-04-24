import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'lists', timestamps: true })
export class List {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Space' })
  spaceId: mongoose.Types.ObjectId;

  @Prop({ required: true }) name: string;
  @Prop({ required: true, default: 0 }) order: number;
}

export type ListDocument = List & Document;
export const ListSchema = SchemaFactory.createForClass(List);

ListSchema.index({ spaceId: 1, order: 1 });
ListSchema.index({ workspaceId: 1 });
