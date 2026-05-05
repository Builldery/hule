import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { SpaceShareService } from '../../../domain/modules/space-share/space-share.service';
import { TaskService } from '../../../domain/modules/task/task.service';
import { SharedSpaceDto } from '../../../domain/entity/space/shared-space.dto';
import { TaskDto } from '../../../domain/entity/task/task.dto';
import { EIncludeSubtasks } from '../../../domain/entity/task/tasks-list-query.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

class ListIdParamsDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  listId: string;
}

class SharedListTasksQueryDto {
  @ApiProperty({
    required: false,
    enum: EIncludeSubtasks,
    default: EIncludeSubtasks.False,
  })
  @IsEnum(EIncludeSubtasks)
  @IsOptional()
  includeSubtasks?: EIncludeSubtasks = EIncludeSubtasks.False;
}

@ApiTags('SharedSpace')
@ApiBearerAuth()
@Controller()
export class RestApiSharedSpaceController {
  @Inject() spaceShareService: SpaceShareService;
  @Inject() taskService: TaskService;

  @ApiResponse({ type: [SharedSpaceDto] })
  @Get('shared-spaces')
  list(@CurrentUser() user: JwtPayload): Promise<Array<SharedSpaceDto>> {
    return this.spaceShareService.listSharedWithUser(user.id);
  }

  @ApiResponse({ type: [TaskDto] })
  @Get('shared-lists/:listId/tasks')
  async tasksByList(
    @CurrentUser() user: JwtPayload,
    @Param() params: ListIdParamsDto,
    @Query() query: SharedListTasksQueryDto,
  ): Promise<Array<TaskDto>> {
    const list = await this.spaceShareService.assertReadAccessToList(
      new Types.ObjectId(params.listId),
      new Types.ObjectId(user.id),
    );
    return this.taskService.getByListQuery(list.workspaceId.toHexString(), {
      listId: params.listId,
      includeSubtasks: query.includeSubtasks ?? EIncludeSubtasks.False,
    });
  }
}
