import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { GridfsService } from '../../../adapters/gridfs/gridfs.service';

@Injectable()
export class FileService {
  constructor(private readonly gridfs: GridfsService) {}

  async getMeta(id: string): Promise<{ length: number; contentType?: string }> {
    const meta = await this.gridfs.findFileMeta(new ObjectId(id));
    if (!meta) throw new NotFoundException('File not found');
    return meta;
  }

  openDownloadStream(id: string) {
    return this.gridfs.openDownloadStream(new ObjectId(id));
  }
}
