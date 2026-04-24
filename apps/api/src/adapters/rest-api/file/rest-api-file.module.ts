import { Module } from '@nestjs/common';
import { FileModule } from '../../../domain/modules/file/file.module';
import {
  RestApiFileController,
  RestApiFilePublicController,
} from './rest-api-file.controller';

@Module({
  imports: [FileModule],
  controllers: [RestApiFileController, RestApiFilePublicController],
})
export class RestApiFileModule {}
