import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import {
  EActionConditionOp,
  EActionEffectKind,
  EActionEvent,
} from '../../domain/entity/action/action.constants';

@Schema({ _id: false })
export class ActionCondition {
  @Prop({ required: true }) field: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(EActionConditionOp),
  })
  op: EActionConditionOp;

  @Prop({ type: mongoose.Schema.Types.Mixed }) value: unknown;
}
const ActionConditionSchema = SchemaFactory.createForClass(ActionCondition);

@Schema({ _id: false })
export class ActionScope {
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  spaceId: mongoose.Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  listId: mongoose.Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  taskId: mongoose.Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  templateId: mongoose.Types.ObjectId | null;
}
const ActionScopeSchema = SchemaFactory.createForClass(ActionScope);

@Schema({ collection: 'actions', timestamps: true })
export class Action {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true }) name: string;
  @Prop({ required: true, default: true }) active: boolean;
  @Prop({ required: true, default: true }) skipOnBulk: boolean;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(EActionEvent),
  })
  triggerEvent: EActionEvent;

  @Prop({ type: ActionConditionSchema, default: null })
  triggerCondition: ActionCondition | null;

  @Prop({ type: ActionScopeSchema, default: () => ({}) })
  triggerScope: ActionScope;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(EActionEffectKind),
  })
  effectKind: EActionEffectKind;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  effectParams: Record<string, unknown>;
}

export type ActionDocument = Action & Document;
export const ActionSchema = SchemaFactory.createForClass(Action);

ActionSchema.index({ workspaceId: 1, active: 1, triggerEvent: 1 });
ActionSchema.index({ 'triggerScope.templateId': 1 });
ActionSchema.index({ 'triggerScope.taskId': 1 });
ActionSchema.index({ 'triggerScope.listId': 1 });
ActionSchema.index({ 'triggerScope.spaceId': 1 });
