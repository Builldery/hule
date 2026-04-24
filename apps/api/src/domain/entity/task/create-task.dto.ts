import {ApiProperty} from '@nestjs/swagger';
import {
    ArrayUnique,
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
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

    @ApiProperty({required: false, nullable: true})
    @IsOptional()
    @ValidateIf((_o, v) => v !== null && v !== undefined)
    @IsMongoId()
    assigneeId?: string | null;

    @ApiProperty({required: false, type: [String]})
    @IsOptional() @IsArray() @ArrayUnique() @IsMongoId({each: true})
    tagIds?: Array<string>;

    @ApiProperty({required: false})
    @IsOptional() @IsInt() @Min(0)
    timeEstimate?: number;

    @ApiProperty({required: false})
    @IsOptional() @IsInt() @Min(0)
    trackedTime?: number;
}
