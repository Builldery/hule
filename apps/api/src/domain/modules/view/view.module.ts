import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { View, ViewSchema } from '../../../adapters/mongo/view.schema';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import { ViewService } from './view.service';
import { PinModule } from '../pin/pin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: View.name, schema: ViewSchema },
      { name: List.name, schema: ListSchema },
    ]),
    PinModule,
  ],
  providers: [ViewService],
  exports: [ViewService],
})
export class ViewModule {}
