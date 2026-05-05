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
import { ViewService } from '../../../domain/modules/view/view.service';
import { ViewDto } from '../../../domain/entity/view/view.dto';
import { CreateViewDto } from '../../../domain/entity/view/create-view.dto';
import { UpdateViewDto } from '../../../domain/entity/view/update-view.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('View')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/views')
export class RestApiViewController {
  @Inject() viewService: ViewService;

  @ApiResponse({ type: [ViewDto] })
  @Get()
  getAll(@CurrentWorkspaceId() wsId: string): Promise<Array<ViewDto>> {
    return this.viewService.getAll(wsId);
  }

  @ApiResponse({ type: ViewDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<ViewDto> {
    return this.viewService.getById(wsId, params.id);
  }

  @ApiResponse({ type: ViewDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateViewDto,
  ): Promise<ViewDto> {
    return this.viewService.create(wsId, dto);
  }

  @ApiResponse({ type: ViewDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateViewDto,
  ): Promise<ViewDto> {
    return this.viewService.update(wsId, params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.viewService.delete(wsId, params.id);
  }
}
