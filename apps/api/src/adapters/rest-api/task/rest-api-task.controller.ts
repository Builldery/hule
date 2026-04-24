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
import { TaskService } from '../../../domain/modules/task/task.service';
import { TaskDto } from '../../../domain/entity/task/task.dto';
import { CreateTaskDto } from '../../../domain/entity/task/create-task.dto';
import { UpdateTaskDto } from '../../../domain/entity/task/update-task.dto';
import { MoveTaskDto } from '../../../domain/entity/task/move-task.dto';
import { TasksListQueryDto } from '../../../domain/entity/task/tasks-list-query.dto';
import { TimelineQueryDto } from '../../../domain/entity/task/timeline-query.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('Task')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/tasks')
export class RestApiTaskController {
  @Inject() taskService: TaskService;

  @ApiResponse({ type: [TaskDto] })
  @Get()
  getByList(
    @CurrentWorkspaceId() wsId: string,
    @Query() query: TasksListQueryDto,
  ): Promise<Array<TaskDto>> {
    return this.taskService.getByListQuery(wsId, query);
  }

  @ApiResponse({ type: [TaskDto] })
  @Get('timeline')
  timeline(
    @CurrentWorkspaceId() wsId: string,
    @Query() query: TimelineQueryDto,
  ): Promise<Array<TaskDto>> {
    return this.taskService.timeline(wsId, query);
  }

  @ApiResponse({ type: [TaskDto] })
  @Get(':id/subtree')
  subtree(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<Array<TaskDto>> {
    return this.taskService.getSubtree(wsId, params.id);
  }

  @ApiResponse({ type: TaskDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<TaskDto> {
    return this.taskService.getById(wsId, params.id);
  }

  @ApiResponse({ type: TaskDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskDto> {
    return this.taskService.create(wsId, dto);
  }

  @ApiResponse({ type: TaskDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() patch: UpdateTaskDto,
  ): Promise<TaskDto> {
    return this.taskService.update(wsId, params.id, patch);
  }

  @Post(':id/move')
  @HttpCode(204)
  async move(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() dto: MoveTaskDto,
  ): Promise<void> {
    await this.taskService.move(wsId, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.taskService.delete(wsId, params.id);
  }
}
