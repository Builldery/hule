import { Types } from 'mongoose';

export function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
