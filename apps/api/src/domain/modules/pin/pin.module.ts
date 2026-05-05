import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pin, PinSchema } from '../../../adapters/mongo/pin.schema';
import { PinService } from './pin.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pin.name, schema: PinSchema }]),
  ],
  providers: [PinService],
  exports: [PinService],
})
export class PinModule {}
