import { Module } from '@nestjs/common';
import { ListModule } from '../../../domain/modules/list/list.module';
import { RestApiListController } from './rest-api-list.controller';

@Module({
  imports: [ListModule],
  controllers: [RestApiListController],
})
export class RestApiListModule {}
