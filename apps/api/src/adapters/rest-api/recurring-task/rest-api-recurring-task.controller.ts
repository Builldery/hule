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
import { RecurringJobService } from '../../../domain/modules/recurring-job/recurring-job.service';
import { RecurringTaskDto } from '../../../domain/entity/recurring-job/recurring-task.dto';
import { CreateRecurringTaskDto } from '../../../domain/entity/recurring-job/create-recurring-task.dto';
import { UpdateRecurringTaskDto } from '../../../domain/entity/recurring-job/update-recurring-task.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';

@ApiTags('RecurringTask')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/recurring-tasks')
export class RestApiRecurringTaskController {
  @Inject() recurringJobService: RecurringJobService;

  @ApiResponse({ type: [RecurringTaskDto] })
  @Get()
  list(
    @CurrentWorkspaceId() wsId: string,
  ): Promise<Array<RecurringTaskDto>> {
    return this.recurringJobService.list(wsId);
  }

  @ApiResponse({ type: RecurringTaskDto })
  @Get(':id')
  getById(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<RecurringTaskDto> {
    return this.recurringJobService.getById(wsId, params.id);
  }

  @ApiResponse({ type: RecurringTaskDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @Body() dto: CreateRecurringTaskDto,
  ): Promise<RecurringTaskDto> {
    return this.recurringJobService.create(wsId, dto);
  }

  @ApiResponse({ type: RecurringTaskDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
    @Body() dto: UpdateRecurringTaskDto,
  ): Promise<RecurringTaskDto> {
    return this.recurringJobService.update(wsId, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.recurringJobService.delete(wsId, params.id);
  }
}
