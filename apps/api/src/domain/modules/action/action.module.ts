import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Action, ActionSchema } from '../../../adapters/mongo/action.schema';
import { TaskCopyModule } from '../task-copy/task-copy.module';
import { ActionService } from './action.service';
import { ActionEngineService } from './action-engine.service';
import { EffectsRegistryService } from './effects/effects-registry.service';
import { SpawnTaskFromTemplateEffect } from './effects/spawn-task-from-template.effect';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Action.name, schema: ActionSchema }]),
    TaskCopyModule,
  ],
  providers: [
    ActionService,
    ActionEngineService,
    EffectsRegistryService,
    SpawnTaskFromTemplateEffect,
  ],
  exports: [ActionService],
})
export class ActionModule {}
