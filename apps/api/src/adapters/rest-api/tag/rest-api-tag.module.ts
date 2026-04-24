import { Module } from '@nestjs/common';
import { TagModule } from '../../../domain/modules/tag/tag.module';
import { RestApiTagController } from './rest-api-tag.controller';

@Module({
  imports: [TagModule],
  controllers: [RestApiTagController],
})
export class RestApiTagModule {}
