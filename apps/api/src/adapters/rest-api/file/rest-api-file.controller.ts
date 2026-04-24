import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { FileService } from '../../../domain/modules/file/file.service';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@ApiTags('File')
@ApiBearerAuth()
@Controller('files')
export class RestApiFilePublicController {
  @Inject() fileService: FileService;

  @Get('r2/url')
  @ApiQuery({ name: 'key', required: true })
  async presignedR2Url(
    @CurrentUser() user: JwtPayload | undefined,
    @Query('key') key: string,
  ): Promise<{ url: string }> {
    if (!key) throw new BadRequestException('key query param is required');
    const wsId = key.split('/')[0];
    if (!wsId) throw new BadRequestException('key must be prefixed with workspaceId');
    if (!user?.workspaceIds?.includes(wsId)) {
      throw new ForbiddenException('File does not belong to a workspace you can access');
    }
    const url = await this.fileService.getR2PresignedUrl(wsId, key);
    return { url };
  }
}

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
