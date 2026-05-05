import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ESpaceShareRole } from './space.constants';

export class ShareSpaceDto {
  @ApiProperty({ description: 'Email of the user to share the space with' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    enum: ESpaceShareRole,
    required: false,
    description: 'Defaults to "viewer". Only "viewer" is honored in MVP.',
  })
  @IsEnum(ESpaceShareRole)
  @IsOptional()
  role?: ESpaceShareRole;
}
