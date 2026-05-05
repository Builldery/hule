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
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@ApiTags('View')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/views')
export class RestApiViewController {
  @Inject() viewService: ViewService;

  @ApiResponse({ type: [ViewDto] })
  @Get()
  getAll(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Array<ViewDto>> {
    return this.viewService.getAll(wsId, user.id);
  }

  @ApiResponse({ type: ViewDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Param() params: IdParamsDto,
  ): Promise<ViewDto> {
    return this.viewService.getById(wsId, user.id, params.id);
  }

  @ApiResponse({ type: ViewDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateViewDto,
  ): Promise<ViewDto> {
    return this.viewService.create(wsId, user.id, dto);
  }

  @ApiResponse({ type: ViewDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateViewDto,
  ): Promise<ViewDto> {
    return this.viewService.update(wsId, user.id, params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.viewService.delete(wsId, user.id, params.id);
  }
}
