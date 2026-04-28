import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { EIncludeSubtasks } from '../task/tasks-list-query.dto';

export class TaskTemplatesListQueryDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ required: false, enum: EIncludeSubtasks, default: EIncludeSubtasks.False })
  @IsEnum(EIncludeSubtasks) @IsOptional()
  includeSubtasks?: EIncludeSubtasks = EIncludeSubtasks.False;
}
