import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export enum EIncludeSubtasks {
  True = 'true',
  False = 'false',
}

export class TasksListQueryDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  listId: string;

  @ApiProperty({ required: false, enum: EIncludeSubtasks, default: EIncludeSubtasks.False })
  @IsEnum(EIncludeSubtasks) @IsOptional()
  includeSubtasks?: EIncludeSubtasks = EIncludeSubtasks.False;
}
