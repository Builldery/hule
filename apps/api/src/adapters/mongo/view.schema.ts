import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { EViewKind } from '../../domain/entity/view/view.constants';

@Schema({ collection: 'views', timestamps: true })
export class View {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, enum: Object.values(EViewKind) })
  kind: EViewKind;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], default: [] })
  listIds: Array<mongoose.Types.ObjectId>;
}

export type ViewDocument = View & Document;
export const ViewSchema = SchemaFactory.createForClass(View);

ViewSchema.index({ workspaceId: 1 });
