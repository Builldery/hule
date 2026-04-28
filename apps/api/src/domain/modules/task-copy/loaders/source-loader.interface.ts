import { Types } from 'mongoose';
import { SourceTree } from '../task-copy.types';

export interface SourceLoadOptions {
  workspaceId: Types.ObjectId;
  rootId: Types.ObjectId;
  withSubtasks: boolean;
  withComments: boolean;
}

export interface ISourceLoader {
  load(opts: SourceLoadOptions): Promise<SourceTree>;
}
