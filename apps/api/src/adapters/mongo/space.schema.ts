import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'spaces', timestamps: true })
export class Space {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true }) name: string;
  @Prop() color?: string;
  @Prop({ required: true, default: 0 }) order: number;
}

export type SpaceDocument = Space & Document;
export const SpaceSchema = SchemaFactory.createForClass(Space);

SpaceSchema.index({ workspaceId: 1, order: 1 });
