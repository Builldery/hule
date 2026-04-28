import { ApiProperty } from '@nestjs/swagger';
import {
  EActionConditionOp,
  EActionEffectKind,
  EActionEvent,
} from './action.constants';

export class ActionConditionDto {
  @ApiProperty() field: string;
  @ApiProperty({ enum: EActionConditionOp }) op: EActionConditionOp;
  @ApiProperty() value: unknown;

  constructor(raw: any) {
    this.field = raw?.field;
    this.op = raw?.op;
    this.value = raw?.value;
  }
}

export class ActionScopeDto {
  @ApiProperty({ nullable: true }) spaceId: string | null;
  @ApiProperty({ nullable: true }) listId: string | null;
  @ApiProperty({ nullable: true }) taskId: string | null;
  @ApiProperty({ nullable: true }) templateId: string | null;

  constructor(raw: any) {
    this.spaceId = raw?.spaceId ? raw.spaceId.toString() : null;
    this.listId = raw?.listId ? raw.listId.toString() : null;
    this.taskId = raw?.taskId ? raw.taskId.toString() : null;
    this.templateId = raw?.templateId ? raw.templateId.toString() : null;
  }
}

export class ActionDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() active: boolean;
  @ApiProperty() skipOnBulk: boolean;

  @ApiProperty({ enum: EActionEvent }) triggerEvent: EActionEvent;
  @ApiProperty({ type: ActionConditionDto, nullable: true })
  triggerCondition: ActionConditionDto | null;
  @ApiProperty({ type: ActionScopeDto }) triggerScope: ActionScopeDto;

  @ApiProperty({ enum: EActionEffectKind }) effectKind: EActionEffectKind;
  @ApiProperty() effectParams: Record<string, unknown>;

  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.name = raw?.name;
    this.active = !!raw?.active;
    this.skipOnBulk = !!raw?.skipOnBulk;
    this.triggerEvent = raw?.triggerEvent;
    this.triggerCondition = raw?.triggerCondition
      ? new ActionConditionDto(raw.triggerCondition)
      : null;
    this.triggerScope = new ActionScopeDto(raw?.triggerScope ?? {});
    this.effectKind = raw?.effectKind;
    this.effectParams = raw?.effectParams ?? {};
    this.createdAt =
      raw?.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : raw?.createdAt;
    this.updatedAt =
      raw?.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : raw?.updatedAt;
  }
}
