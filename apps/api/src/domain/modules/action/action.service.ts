import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, ActionDocument } from '../../../adapters/mongo/action.schema';
import { ActionDto } from '../../entity/action/action.dto';
import { CreateActionDto } from '../../entity/action/create-action.dto';
import { UpdateActionDto } from '../../entity/action/update-action.dto';
import { EActionEffectKind } from '../../entity/action/action.constants';
import { EffectsRegistryService } from './effects/effects-registry.service';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function scopeToOids(
  scope?: {
    spaceId?: string | null;
    listId?: string | null;
    taskId?: string | null;
    templateId?: string | null;
  } | null,
): Record<string, Types.ObjectId | null> {
  return {
    spaceId: scope?.spaceId ? toOid(scope.spaceId) : null,
    listId: scope?.listId ? toOid(scope.listId) : null,
    taskId: scope?.taskId ? toOid(scope.taskId) : null,
    templateId: scope?.templateId ? toOid(scope.templateId) : null,
  };
}

@Injectable()
export class ActionService {
  @InjectModel(Action.name) private actionModel: Model<ActionDocument>;

  constructor(private readonly effectsRegistry: EffectsRegistryService) {}

  async list(wsId: string): Promise<Array<ActionDto>> {
    const docs = await this.actionModel
      .find({ workspaceId: toOid(wsId) })
      .sort({ createdAt: -1 });
    return docs.map((d) => new ActionDto(d));
  }

  async getById(wsId: string, id: string): Promise<ActionDto> {
    const doc = await this.actionModel.findOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (!doc) throw new NotFoundException('Action not found');
    return new ActionDto(doc);
  }

  async create(wsId: string, dto: CreateActionDto): Promise<ActionDto> {
    this.assertEffectKnown(dto.effectKind);
    const wsOid = toOid(wsId);
    const doc = await this.actionModel.create({
      workspaceId: wsOid,
      name: dto.name,
      active: dto.active ?? true,
      skipOnBulk: dto.skipOnBulk ?? true,
      triggerEvent: dto.triggerEvent,
      triggerCondition: dto.triggerCondition ?? null,
      triggerScope: scopeToOids(dto.triggerScope),
      effectKind: dto.effectKind,
      effectParams: dto.effectParams,
    });
    return new ActionDto(doc);
  }

  async update(
    wsId: string,
    id: string,
    dto: UpdateActionDto,
  ): Promise<ActionDto> {
    if (dto.effectKind) this.assertEffectKnown(dto.effectKind);
    const wsOid = toOid(wsId);
    const $set: Record<string, unknown> = {};
    if (dto.name !== undefined) $set.name = dto.name;
    if (dto.active !== undefined) $set.active = dto.active;
    if (dto.skipOnBulk !== undefined) $set.skipOnBulk = dto.skipOnBulk;
    if (dto.triggerEvent !== undefined) $set.triggerEvent = dto.triggerEvent;
    if (dto.triggerCondition !== undefined) {
      $set.triggerCondition = dto.triggerCondition;
    }
    if (dto.triggerScope !== undefined) {
      $set.triggerScope = scopeToOids(dto.triggerScope);
    }
    if (dto.effectKind !== undefined) $set.effectKind = dto.effectKind;
    if (dto.effectParams !== undefined) $set.effectParams = dto.effectParams;

    const doc = await this.actionModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: wsOid },
      { $set },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Action not found');
    return new ActionDto(doc);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const res = await this.actionModel.deleteOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (res.deletedCount === 0) throw new NotFoundException('Action not found');
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.actionModel.deleteMany({ workspaceId: wsOid });
  }

  async deleteBySpaceId(
    wsOid: Types.ObjectId,
    spaceOid: Types.ObjectId,
  ): Promise<void> {
    await this.actionModel.deleteMany({
      workspaceId: wsOid,
      'triggerScope.spaceId': spaceOid,
    });
  }

  async existsForTemplate(
    wsOid: Types.ObjectId,
    templateOid: Types.ObjectId,
  ): Promise<boolean> {
    const exists = await this.actionModel.exists({
      workspaceId: wsOid,
      'triggerScope.templateId': templateOid,
    });
    return !!exists;
  }

  private assertEffectKnown(kind: EActionEffectKind): void {
    if (!this.effectsRegistry.resolve(kind)) {
      throw new BadRequestException(`Unknown effect kind: ${kind}`);
    }
  }
}
