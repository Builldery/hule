import { Module } from '@nestjs/common';
import { RestApiHealthController } from './rest-api-health.controller';

@Module({
  controllers: [RestApiHealthController],
})
export class RestApiHealthModule {}
