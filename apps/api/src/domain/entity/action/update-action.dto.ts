import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
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
import {
  CreateActionConditionDto,
  CreateActionScopeDto,
} from './create-action.dto';

export class UpdateActionDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false }) @IsBoolean() @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false }) @IsBoolean() @IsOptional()
  skipOnBulk?: boolean;

  @ApiProperty({ required: false, enum: EActionEvent })
  @IsEnum(EActionEvent) @IsOptional()
  triggerEvent?: EActionEvent;

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

  @ApiProperty({ required: false, enum: EActionEffectKind })
  @IsEnum(EActionEffectKind) @IsOptional()
  effectKind?: EActionEffectKind;

  @ApiProperty({ required: false })
  @IsObject() @IsOptional()
  effectParams?: Record<string, unknown>;
}
