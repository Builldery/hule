import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { FileService } from '../../../domain/modules/file/file.service';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';

@ApiTags('File')
@Controller('files')
export class RestApiFileController {
  @Inject() fileService: FileService;

  @Get(':id')
  async download(
    @Param() params: IdParamsDto,
    @Res({ passthrough: false }) reply: FastifyReply,
  ): Promise<void> {
    const meta = await this.fileService.getMeta(params.id);
    void reply
      .header('Content-Type', meta.contentType ?? 'application/octet-stream')
      .header('Content-Length', String(meta.length))
      .header('Cache-Control', 'public, max-age=31536000, immutable')
      .send(this.fileService.openDownloadStream(params.id));
  }
}
