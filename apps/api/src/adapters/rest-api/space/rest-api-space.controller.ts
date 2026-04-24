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
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpaceService } from '../../../domain/modules/space/space.service';
import { SpaceDto } from '../../../domain/entity/space/space.dto';
import { CreateSpaceDto } from '../../../domain/entity/space/create-space.dto';
import { UpdateSpaceDto } from '../../../domain/entity/space/update-space.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { ReorderItemDto } from '../../../domain/entity/common/reorder.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('Space')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/spaces')
export class RestApiSpaceController {
  @Inject() spaceService: SpaceService;

  @ApiResponse({ type: [SpaceDto] })
  @Get()
  getAll(@CurrentWorkspaceId() wsId: string): Promise<Array<SpaceDto>> {
    return this.spaceService.getAll(wsId);
  }

  @ApiResponse({ type: SpaceDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateSpaceDto,
  ): Promise<SpaceDto> {
    return this.spaceService.create(wsId, dto);
  }

  @ApiResponse({ type: SpaceDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateSpaceDto,
  ): Promise<SpaceDto> {
    return this.spaceService.update(wsId, params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.spaceService.delete(wsId, params.id);
  }

  @Post('reorder')
  @HttpCode(204)
  async reorder(
    @CurrentWorkspaceId() wsId: string,
    @Body(new ParseArrayPipe({ items: ReorderItemDto, whitelist: true }))
    items: Array<ReorderItemDto>,
  ): Promise<void> {
    await this.spaceService.reorder(wsId, items);
  }
}
