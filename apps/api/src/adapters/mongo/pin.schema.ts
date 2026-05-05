import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { EPinEntity } from '../../domain/entity/pin/pin.constants';

@Schema({ collection: 'pins', timestamps: true })
export class Pin {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  userId: mongoose.Types.ObjectId | null;

  @Prop({ required: true }) label: string;
  @Prop() iconName?: string;
  @Prop({ required: true, default: 0 }) order: number;

  @Prop({ required: true, enum: Object.values(EPinEntity) })
  entity: EPinEntity;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId })
  entityId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null })
  entityWorkspaceId: mongoose.Types.ObjectId | null;
}

export type PinDocument = Pin & Document;
export const PinSchema = SchemaFactory.createForClass(Pin);

PinSchema.index({ workspaceId: 1, userId: 1, order: 1 });
PinSchema.index({ workspaceId: 1, entity: 1, entityId: 1 });
PinSchema.index({ entityWorkspaceId: 1, entity: 1, entityId: 1 });
