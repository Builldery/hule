import {ApiProperty} from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';
import {ETaskPriority} from './task.constants';

export class CreateTaskDto {
    @ApiProperty() @IsMongoId() @IsNotEmpty()
    listId: string;

    @ApiProperty({required: false, nullable: true})
    @IsOptional()
    @ValidateIf((_o, v) => v !== null && v !== undefined)
    @IsMongoId()
    parentId?: string | null;

    @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(500)
    title: string;

    @ApiProperty({required: false}) @IsString() @IsOptional() @MaxLength(20000)
    description?: string;

    @ApiProperty({required: false, default: 'todo'})
    @IsString() @IsOptional() @MinLength(1) @MaxLength(40)
    status?: string = 'todo';

    @ApiProperty({required: false, enum: ETaskPriority, default: ETaskPriority.None})
    @IsEnum(ETaskPriority) @IsOptional()
    priority?: ETaskPriority = ETaskPriority.None;

    @ApiProperty({required: false}) @IsDateString() @IsOptional()
    startDate?: string;

    @ApiProperty({required: false}) @IsDateString() @IsOptional()
    dueDate?: string;
}
