import { Module } from '@nestjs/common';
import { ViewModule } from '../../../domain/modules/view/view.module';
import { RestApiViewController } from './rest-api-view.controller';

@Module({
  imports: [ViewModule],
  controllers: [RestApiViewController],
})
export class RestApiViewModule {}
