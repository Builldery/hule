import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { EViewKind } from '../../domain/entity/view/view.constants';

@Schema({ _id: false })
export class ViewListRef {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'List' })
  listId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;
}

const ViewListRefSchema = SchemaFactory.createForClass(ViewListRef);

@Schema({ collection: 'views', timestamps: true })
export class View {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  userId: mongoose.Types.ObjectId | null;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, enum: Object.values(EViewKind) })
  kind: EViewKind;

  @Prop({ type: [ViewListRefSchema], default: [] })
  listRefs: Array<ViewListRef>;

  // Legacy: prior schema stored listIds in the view's own workspace. Kept for
  // read compatibility; new writes populate listRefs and clear listIds.
  @Prop({ type: [mongoose.Schema.Types.ObjectId], default: [] })
  listIds: Array<mongoose.Types.ObjectId>;
}

export type ViewDocument = View & Document;
export const ViewSchema = SchemaFactory.createForClass(View);

ViewSchema.index({ workspaceId: 1, userId: 1 });
ViewSchema.index({ 'listRefs.listId': 1 });
ViewSchema.index({ 'listRefs.workspaceId': 1 });
