import { Types } from 'mongoose';
import { EActionEffectKind } from '../../../entity/action/action.constants';

export interface ActionEventPayload {
  workspaceId: Types.ObjectId;
  before: Record<string, any> | null;
  after: Record<string, any>;
  isBulk: boolean;
}

export interface IActionEffect {
  readonly kind: EActionEffectKind;
  execute(
    payload: ActionEventPayload,
    params: Record<string, unknown>,
  ): Promise<void>;
}
