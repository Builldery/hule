import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { GridfsModule } from '../../../adapters/gridfs/gridfs.module';

@Module({
  imports: [GridfsModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
