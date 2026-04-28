import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CopyPlan,
  PlannedComment,
  PlannedTask,
  SourceNode,
} from '../task-copy.types';

@Injectable()
export class TransformStage {
  run(plan: CopyPlan): CopyPlan {
    const rootSourceHex = plan.source.rootSourceId.toHexString();
    const plannedTasks: Array<PlannedTask> = plan.source.nodes.map((node) =>
      this.transformNode(node, plan, rootSourceHex),
    );
    const plannedComments: Array<PlannedComment> = plan.source.comments.map(
      (c) => ({
        workspaceId: plan.options.targetWorkspaceId,
        taskId: plan.idMap.get(c.sourceTaskId.toHexString())!,
        kind: c.kind,
        body: c.body,
        activity: c.activity,
        attachments: [],
        createdAt: c.createdAt,
      }),
    );
    return { ...plan, plannedTasks, plannedComments };
  }

  private transformNode(
    node: SourceNode,
    plan: CopyPlan,
    rootSourceHex: string,
  ): PlannedTask {
    const isRoot = node.sourceId.toHexString() === rootSourceHex;
    const newId = plan.idMap.get(node.sourceId.toHexString())!;
    const path = isRoot
      ? [...plan.targetParentPath]
      : this.buildDescendantPath(node, plan, rootSourceHex);
    const parentId = isRoot
      ? plan.options.targetParentId
      : plan.idMap.get(node.parentSourceId!.toHexString())!;
    const order = isRoot ? plan.options.rootOrder ?? 0 : node.order;

    return {
      _id: newId,
      workspaceId: plan.options.targetWorkspaceId,
      listId: plan.options.targetListId,
      parentId,
      path,
      depth: path.length,
      order,
      title: node.title,
      description: node.description,
      status: plan.options.setStatus ?? node.status,
      priority: node.priority,
      startDate: this.resolveDate(
        node.startDate,
        plan.options.setDates?.startDate,
        isRoot,
      ),
      dueDate: this.resolveDate(
        node.dueDate,
        plan.options.setDates?.dueDate,
        isRoot,
      ),
      assigneeId: plan.options.resetAssignee ? null : node.assigneeId,
      tagIds: node.tagIds,
      timeEstimate: node.timeEstimate,
      trackedTime: plan.options.resetTrackedTime ? undefined : node.trackedTime,
      spawnedFromTemplateId: plan.options.spawnedFromTemplateRootId ?? null,
    };
  }

  private buildDescendantPath(
    node: SourceNode,
    plan: CopyPlan,
    rootSourceHex: string,
  ): Array<Types.ObjectId> {
    const newRootId = plan.idMap.get(rootSourceHex)!;
    const rootIdx = node.sourcePath.findIndex(
      (p) => p.toHexString() === rootSourceHex,
    );
    if (rootIdx < 0) {
      throw new Error('Descendant path missing source root');
    }
    const interior = node.sourcePath.slice(rootIdx + 1);
    const interiorMapped = interior.map(
      (p) => plan.idMap.get(p.toHexString())!,
    );
    return [...plan.targetParentPath, newRootId, ...interiorMapped];
  }

  private resolveDate(
    sourceDate: Date | undefined,
    override: Date | null | undefined,
    isRoot: boolean,
  ): Date | undefined {
    if (!isRoot) return sourceDate;
    if (override === undefined) return sourceDate;
    if (override === null) return undefined;
    return override;
  }
}
