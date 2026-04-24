import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../user/user.dto';

export class AuthResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty({ type: UserDto }) user: UserDto;

  constructor(access_token: string, user: UserDto) {
    this.access_token = access_token;
    this.user = user;
  }
}
