import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CommentService } from '../../../domain/modules/comment/comment.service';
import { CommentDto } from '../../../domain/entity/comment/comment.dto';
import { UpdateCommentDto } from '../../../domain/entity/comment/update-comment.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('Comment')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId')
export class RestApiCommentController {
  @Inject() commentService: CommentService;

  @ApiResponse({ type: [CommentDto] })
  @Get('tasks/:id/comments')
  getByTask(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<Array<CommentDto>> {
    return this.commentService.getByTaskId(wsId, params.id);
  }

  @ApiResponse({ type: CommentDto })
  @Post('tasks/:id/comments')
  create(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Req() req: FastifyRequest,
  ): Promise<CommentDto> {
    return this.commentService.createForTask(wsId, params.id, req);
  }

  @ApiResponse({ type: CommentDto })
  @Patch('comments/:id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentDto> {
    return this.commentService.update(wsId, params.id, dto);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.commentService.delete(wsId, params.id);
  }
}
