import { Injectable } from '@nestjs/common';
import { EActionEffectKind } from '../../../entity/action/action.constants';
import { IActionEffect } from './effect.interface';
import { SpawnTaskFromTemplateEffect } from './spawn-task-from-template.effect';

@Injectable()
export class EffectsRegistryService {
  private readonly byKind: Map<EActionEffectKind, IActionEffect>;

  constructor(spawnFromTemplate: SpawnTaskFromTemplateEffect) {
    this.byKind = new Map<EActionEffectKind, IActionEffect>([
      [spawnFromTemplate.kind, spawnFromTemplate],
    ]);
  }

  resolve(kind: EActionEffectKind): IActionEffect | null {
    return this.byKind.get(kind) ?? null;
  }
}
