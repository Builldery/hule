import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CopyPlan } from '../task-copy.types';

@Injectable()
export class RemapIdsStage {
  run(plan: CopyPlan): CopyPlan {
    const idMap = new Map<string, Types.ObjectId>();
    for (const node of plan.source.nodes) {
      idMap.set(node.sourceId.toHexString(), new Types.ObjectId());
    }
    const resultRootId =
      idMap.get(plan.source.rootSourceId.toHexString()) ?? null;
    return { ...plan, idMap, resultRootId };
  }
}
