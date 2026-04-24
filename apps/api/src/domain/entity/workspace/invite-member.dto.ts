import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ description: 'Username or email of an existing user' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  login: string;
}
