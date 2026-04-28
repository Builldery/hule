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
import { ActionService } from '../../../domain/modules/action/action.service';
import { ActionDto } from '../../../domain/entity/action/action.dto';
import { CreateActionDto } from '../../../domain/entity/action/create-action.dto';
import { UpdateActionDto } from '../../../domain/entity/action/update-action.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('Action')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/actions')
export class RestApiActionController {
  @Inject() actionService: ActionService;

  @ApiResponse({ type: [ActionDto] })
  @Get()
  list(@CurrentWorkspaceId() wsId: string): Promise<Array<ActionDto>> {
    return this.actionService.list(wsId);
  }

  @ApiResponse({ type: ActionDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<ActionDto> {
    return this.actionService.getById(wsId, params.id);
  }

  @ApiResponse({ type: ActionDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateActionDto,
  ): Promise<ActionDto> {
    return this.actionService.create(wsId, dto);
  }

  @ApiResponse({ type: ActionDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() dto: UpdateActionDto,
  ): Promise<ActionDto> {
    return this.actionService.update(wsId, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.actionService.delete(wsId, params.id);
  }
}
