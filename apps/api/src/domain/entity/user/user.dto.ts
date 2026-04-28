import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: UserDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.email = raw?.email;
    this.name = raw?.name;
    this.createdAt =
      raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt =
      raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
