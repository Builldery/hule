import { Module } from '@nestjs/common';
import { PinModule } from '../../../domain/modules/pin/pin.module';
import { RestApiPinController } from './rest-api-pin.controller';

@Module({
  imports: [PinModule],
  controllers: [RestApiPinController],
})
export class RestApiPinModule {}
