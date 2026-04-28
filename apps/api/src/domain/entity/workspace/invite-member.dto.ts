import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ description: 'Email of an existing user' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
