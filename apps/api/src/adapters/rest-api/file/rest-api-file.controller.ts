import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { FileService } from '../../../domain/modules/file/file.service';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('File')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/files')
export class RestApiFileController {
  @Inject() fileService: FileService;

  @Get(':id')
  async download(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Res({ passthrough: false }) reply: FastifyReply,
  ): Promise<void> {
    const meta = await this.fileService.getMeta(wsId, params.id);
    const stream = await this.fileService.openDownloadStream(wsId, params.id);
    void reply
      .header('Content-Type', meta.contentType ?? 'application/octet-stream')
      .header('Content-Length', String(meta.length))
      .header('Cache-Control', 'public, max-age=31536000, immutable')
      .send(stream);
  }
}
