import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ESpaceShareRole } from '../../domain/entity/space/space.constants';

@Schema({ _id: false })
export class SpaceShareEntry {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ESpaceShareRole) })
  role: ESpaceShareRole;
}

const SpaceShareEntrySchema = SchemaFactory.createForClass(SpaceShareEntry);

@Schema({ collection: 'spaces', timestamps: true })
export class Space {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true }) name: string;
  @Prop() color?: string;
  @Prop() iconName?: string;
  @Prop({ required: true, default: 0 }) order: number;

  @Prop({ type: [SpaceShareEntrySchema], default: [] })
  sharedWith: Array<SpaceShareEntry>;
}

export type SpaceDocument = Space & Document;
export const SpaceSchema = SchemaFactory.createForClass(Space);

SpaceSchema.index({ workspaceId: 1, order: 1 });
SpaceSchema.index({ 'sharedWith.userId': 1 });
