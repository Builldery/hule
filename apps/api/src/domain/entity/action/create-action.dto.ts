import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  EActionConditionOp,
  EActionEffectKind,
  EActionEvent,
} from './action.constants';

export class CreateActionConditionDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: EActionConditionOp })
  @IsEnum(EActionConditionOp)
  op: EActionConditionOp;

  @ApiProperty()
  value: unknown;
}

export class CreateActionScopeDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsMongoId()
  spaceId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsMongoId()
  listId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsMongoId()
  taskId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsMongoId()
  templateId?: string | null;
}

export class CreateActionDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(200)
  name: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean() @IsOptional()
  active?: boolean = true;

  @ApiProperty({ required: false, default: true })
  @IsBoolean() @IsOptional()
  skipOnBulk?: boolean = true;

  @ApiProperty({ enum: EActionEvent })
  @IsEnum(EActionEvent)
  triggerEvent: EActionEvent;

  @ApiProperty({ required: false, type: CreateActionConditionDto, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => CreateActionConditionDto)
  triggerCondition?: CreateActionConditionDto | null;

  @ApiProperty({ required: false, type: CreateActionScopeDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateActionScopeDto)
  triggerScope?: CreateActionScopeDto;

  @ApiProperty({ enum: EActionEffectKind })
  @IsEnum(EActionEffectKind)
  effectKind: EActionEffectKind;

  @ApiProperty()
  @IsObject()
  effectParams: Record<string, unknown>;
}
