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
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TagService } from '../../../domain/modules/tag/tag.service';
import { TagDto } from '../../../domain/entity/tag/tag.dto';
import { CreateTagDto } from '../../../domain/entity/tag/create-tag.dto';
import { UpdateTagDto } from '../../../domain/entity/tag/update-tag.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('Tag')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/tags')
export class RestApiTagController {
  @Inject() tagService: TagService;

  @ApiResponse({ type: [TagDto] })
  @Get()
  getByWorkspace(@CurrentWorkspaceId() wsId: string): Promise<Array<TagDto>> {
    return this.tagService.getByWorkspace(wsId);
  }

  @ApiResponse({ type: TagDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<TagDto> {
    return this.tagService.getById(wsId, params.id);
  }

  @ApiResponse({ type: TagDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateTagDto,
  ): Promise<TagDto> {
    return this.tagService.create(wsId, dto);
  }

  @ApiResponse({ type: TagDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateTagDto,
  ): Promise<TagDto> {
    return this.tagService.update(wsId, params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.tagService.delete(wsId, params.id);
  }
}
