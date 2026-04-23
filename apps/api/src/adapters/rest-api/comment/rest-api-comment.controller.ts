import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CommentService } from '../../../domain/modules/comment/comment.service';
import { CommentDto } from '../../../domain/entity/comment/comment.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';

@ApiTags('Comment')
@Controller()
export class RestApiCommentController {
  @Inject() commentService: CommentService;

  @ApiResponse({ type: [CommentDto] })
  @Get('tasks/:id/comments')
  getByTask(@Param() params: IdParamsDto): Promise<Array<CommentDto>> {
    return this.commentService.getByTaskId(params.id);
  }

  @ApiResponse({ type: CommentDto })
  @Post('tasks/:id/comments')
  create(@Param() params: IdParamsDto, @Req() req: FastifyRequest): Promise<CommentDto> {
    return this.commentService.createForTask(params.id, req);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  async delete(@Param() params: IdParamsDto): Promise<void> {
    await this.commentService.delete(params.id);
  }
}
