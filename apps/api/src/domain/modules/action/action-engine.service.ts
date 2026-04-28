import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, ActionDocument } from '../../../adapters/mongo/action.schema';
import {
  TaskAfterUpdateEvent,
  taskEventsBus,
} from '../../../adapters/mongo/task-events.bus';
import {
  EActionConditionOp,
  EActionEvent,
} from '../../entity/action/action.constants';
import { EffectsRegistryService } from './effects/effects-registry.service';
import { ActionEventPayload } from './effects/effect.interface';

@Injectable()
export class ActionEngineService implements OnModuleInit {
  private readonly logger = new Logger(ActionEngineService.name);

  @InjectModel(Action.name) private actionModel: Model<ActionDocument>;

  constructor(private readonly effectsRegistry: EffectsRegistryService) {}

  onModuleInit(): void {
    taskEventsBus.on('task.after-update', (e: TaskAfterUpdateEvent) => {
      this.handleTaskAfterUpdate(e).catch((err) => {
        this.logger.error(
          `task.after-update dispatch failed: ${(err as Error).message}`,
          (err as Error).stack,
        );
      });
    });
  }

  private async handleTaskAfterUpdate(
    e: TaskAfterUpdateEvent,
  ): Promise<void> {
    const wsOid = new Types.ObjectId(e.workspaceId);
    const candidates = await this.actionModel.find({
      workspaceId: wsOid,
      active: true,
      triggerEvent: EActionEvent.TaskAfterUpdate,
    });
    if (!candidates.length) return;

    const payload: ActionEventPayload = {
      workspaceId: wsOid,
      before: e.before,
      after: e.after,
      isBulk: e.isBulk,
    };

    for (const action of candidates) {
      if (action.skipOnBulk && e.isBulk) continue;
      if (!this.matchesScope(action, e.after)) continue;
      if (!this.matchesCondition(action, e.before, e.after)) continue;
      const effect = this.effectsRegistry.resolve(action.effectKind);
      if (!effect) {
        this.logger.warn(
          `Action ${action._id} references unknown effect ${action.effectKind}`,
        );
        continue;
      }
      try {
        await effect.execute(payload, action.effectParams);
      } catch (err) {
        this.logger.error(
          `Effect ${action.effectKind} failed for action ${action._id}: ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
    }
  }

  private matchesScope(
    action: ActionDocument,
    after: Record<string, any>,
  ): boolean {
    const s = action.triggerScope;
    if (!s) return true;
    if (s.spaceId && !equalsOid(s.spaceId, after?.spaceId)) return false;
    if (s.listId && !equalsOid(s.listId, after?.listId)) return false;
    if (s.taskId && !equalsOid(s.taskId, after?._id ?? after?.id)) return false;
    if (
      s.templateId &&
      !equalsOid(s.templateId, after?.spawnedFromTemplateId)
    ) {
      return false;
    }
    return true;
  }

  private matchesCondition(
    action: ActionDocument,
    before: Record<string, any> | null,
    after: Record<string, any>,
  ): boolean {
    const c = action.triggerCondition;
    if (!c) return true;
    const afterVal = after?.[c.field];
    const beforeVal = before?.[c.field];
    switch (c.op) {
      case EActionConditionOp.Equals:
        return afterVal === c.value;
      case EActionConditionOp.ChangedTo:
        return beforeVal !== c.value && afterVal === c.value;
    }
    return false;
  }
}

function equalsOid(a: any, b: any): boolean {
  if (a == null || b == null) return false;
  const aHex = typeof a === 'string' ? a : a.toHexString?.() ?? a.toString?.();
  const bHex = typeof b === 'string' ? b : b.toHexString?.() ?? b.toString?.();
  return aHex === bHex;
}
