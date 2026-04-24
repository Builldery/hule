import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListService } from '../../../domain/modules/list/list.service';
import { ListDto } from '../../../domain/entity/list/list.dto';
import { CreateListDto } from '../../../domain/entity/list/create-list.dto';
import { UpdateListDto } from '../../../domain/entity/list/update-list.dto';
import { ListsQueryDto } from '../../../domain/entity/list/lists-query.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { ReorderItemDto } from '../../../domain/entity/common/reorder.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('List')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/lists')
export class RestApiListController {
  @Inject() listService: ListService;

  @ApiResponse({ type: [ListDto] })
  @Get()
  getBySpace(
    @CurrentWorkspaceId() wsId: string,
    @Query() query: ListsQueryDto,
  ): Promise<Array<ListDto>> {
    return this.listService.getBySpace(wsId, query.spaceId);
  }

  @ApiResponse({ type: ListDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateListDto,
  ): Promise<ListDto> {
    return this.listService.create(wsId, dto);
  }

  @ApiResponse({ type: ListDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateListDto,
  ): Promise<ListDto> {
    return this.listService.update(wsId, params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.listService.delete(wsId, params.id);
  }

  @Post('reorder')
  @HttpCode(204)
  async reorder(
    @CurrentWorkspaceId() wsId: string,
    @Body(new ParseArrayPipe({ items: ReorderItemDto, whitelist: true }))
    items: Array<ReorderItemDto>,
  ): Promise<void> {
    await this.listService.reorder(wsId, items);
  }
}
