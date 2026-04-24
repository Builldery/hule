import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ETagColor } from '../../domain/entity/tag/tag.constants';

@Schema({ collection: 'tags', timestamps: true })
export class Tag {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspaceId: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 40 })
  name: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ETagColor),
    default: ETagColor.Gray,
  })
  color: ETagColor;
}

export type TagDocument = Tag & Document;
export const TagSchema = SchemaFactory.createForClass(Tag);

TagSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
