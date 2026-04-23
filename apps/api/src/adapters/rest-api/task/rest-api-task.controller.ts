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
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskService } from '../../../domain/modules/task/task.service';
import { TaskDto } from '../../../domain/entity/task/task.dto';
import { CreateTaskDto } from '../../../domain/entity/task/create-task.dto';
import { UpdateTaskDto } from '../../../domain/entity/task/update-task.dto';
import { MoveTaskDto } from '../../../domain/entity/task/move-task.dto';
import { TasksListQueryDto } from '../../../domain/entity/task/tasks-list-query.dto';
import { TimelineQueryDto } from '../../../domain/entity/task/timeline-query.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';

@ApiTags('Task')
@Controller('tasks')
export class RestApiTaskController {
  @Inject() taskService: TaskService;

  @ApiResponse({ type: [TaskDto] })
  @Get()
  getByList(@Query() query: TasksListQueryDto): Promise<Array<TaskDto>> {
    return this.taskService.getByListQuery(query);
  }

  @ApiResponse({ type: [TaskDto] })
  @Get('timeline')
  timeline(@Query() query: TimelineQueryDto): Promise<Array<TaskDto>> {
    return this.taskService.timeline(query);
  }

  @ApiResponse({ type: [TaskDto] })
  @Get(':id/subtree')
  subtree(@Param() params: IdParamsDto): Promise<Array<TaskDto>> {
    return this.taskService.getSubtree(params.id);
  }

  @ApiResponse({ type: TaskDto })
  @Get(':id')
  getById(@Param() params: IdParamsDto): Promise<TaskDto> {
    return this.taskService.getById(params.id);
  }

  @ApiResponse({ type: TaskDto })
  @Post()
  create(@Body() dto: CreateTaskDto): Promise<TaskDto> {
    return this.taskService.create(dto);
  }

  @ApiResponse({ type: TaskDto })
  @Patch(':id')
  update(@Param() params: IdParamsDto, @Body() patch: UpdateTaskDto): Promise<TaskDto> {
    return this.taskService.update(params.id, patch);
  }

  @Post(':id/move')
  @HttpCode(204)
  async move(@Param() params: IdParamsDto, @Body() dto: MoveTaskDto): Promise<void> {
    await this.taskService.move(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param() params: IdParamsDto): Promise<void> {
    await this.taskService.delete(params.id);
  }
}
