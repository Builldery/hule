import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { EActionEffectKind } from '../../../entity/action/action.constants';
import { TaskCopyService } from '../../task-copy/task-copy.service';
import {
  localEndOfDay,
  localStartOfDay,
} from '../../recurring-job/schedule-clock';
import { ActionEventPayload, IActionEffect } from './effect.interface';

interface SpawnParams {
  templateId: string;
  targetListId?: string;
  daysOffset?: number;
}

@Injectable()
export class SpawnTaskFromTemplateEffect implements IActionEffect {
  private readonly logger = new Logger(SpawnTaskFromTemplateEffect.name);
  readonly kind = EActionEffectKind.SpawnTaskFromTemplate;

  constructor(private readonly taskCopyService: TaskCopyService) {}

  async execute(
    payload: ActionEventPayload,
    rawParams: Record<string, unknown>,
  ): Promise<void> {
    const params = rawParams as unknown as SpawnParams;
    if (!params.templateId) {
      this.logger.warn('spawn-task-from-template: missing templateId');
      return;
    }
    const targetListId =
      params.targetListId ?? payload.after?.listId?.toString();
    if (!targetListId) {
      this.logger.warn(
        'spawn-task-from-template: no targetListId in params or source task',
      );
      return;
    }

    const days = params.daysOffset ?? 1;
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const startDate = localStartOfDay(target);
    const dueDate = localEndOfDay(target);

    await this.taskCopyService
      .builder()
      .fromTemplate(params.templateId)
      .inWorkspace(payload.workspaceId)
      .toList(new Types.ObjectId(targetListId))
      .asChildOf(null)
      .withSubtasks()
      .withoutComments()
      .resetStatus('todo')
      .setDates({ startDate, dueDate })
      .execute();
  }
}
