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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskTemplateService } from '../../../domain/modules/task-template/task-template.service';
import { TaskTemplateDto } from '../../../domain/entity/task-template/task-template.dto';
import { CreateTaskTemplateDto } from '../../../domain/entity/task-template/create-task-template.dto';
import { UpdateTaskTemplateDto } from '../../../domain/entity/task-template/update-task-template.dto';
import { MoveTaskTemplateDto } from '../../../domain/entity/task-template/move-task-template.dto';
import { TaskTemplatesListQueryDto } from '../../../domain/entity/task-template/task-templates-list-query.dto';
import { SpawnFromTemplateDto } from '../../../domain/entity/task-template/spawn-from-template.dto';
import { TaskDto } from '../../../domain/entity/task/task.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('TaskTemplate')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/task-templates')
export class RestApiTaskTemplateController {
  @Inject() taskTemplateService: TaskTemplateService;

  @ApiResponse({ type: [TaskTemplateDto] })
  @Get()
  getBySpace(
    @CurrentWorkspaceId() wsId: string,
    @Query() query: TaskTemplatesListQueryDto,
  ): Promise<Array<TaskTemplateDto>> {
    return this.taskTemplateService.getBySpaceQuery(wsId, query);
  }

  @ApiResponse({ type: [TaskTemplateDto] })
  @Get(':id/subtree')
  subtree(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<Array<TaskTemplateDto>> {
    return this.taskTemplateService.getSubtree(wsId, params.id);
  }

  @ApiResponse({ type: TaskTemplateDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<TaskTemplateDto> {
    return this.taskTemplateService.getById(wsId, params.id);
  }

  @ApiResponse({ type: TaskTemplateDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateTaskTemplateDto,
  ): Promise<TaskTemplateDto> {
    return this.taskTemplateService.create(wsId, dto);
  }

  @ApiResponse({ type: TaskTemplateDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateTaskTemplateDto,
  ): Promise<TaskTemplateDto> {
    return this.taskTemplateService.update(wsId, params.id, patch);
  }

  @Post(':id/move')
  @HttpCode(204)
  async move(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() dto: MoveTaskTemplateDto,
  ): Promise<void> {
    await this.taskTemplateService.move(wsId, params.id, dto);
  }

  @ApiResponse({ type: TaskDto })
  @Post(':id/spawn')
  spawn(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() dto: SpawnFromTemplateDto,
  ): Promise<TaskDto> {
    return this.taskTemplateService.spawnAsTask(wsId, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.taskTemplateService.delete(wsId, params.id);
  }
}
