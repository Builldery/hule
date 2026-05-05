import { ApiProperty } from '@nestjs/swagger';
import { SpaceDto } from './space.dto';
import { ListDto } from '../list/list.dto';
import { ESpaceShareRole } from './space.constants';

export class SharedSpaceOwnerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;

  constructor(raw: any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.name = raw?.name;
    this.email = raw?.email;
  }
}

export class SharedSpaceDto {
  @ApiProperty({ type: SpaceDto }) space: SpaceDto;
  @ApiProperty({ type: [ListDto] }) lists: Array<ListDto>;
  @ApiProperty({ type: SharedSpaceOwnerDto }) owner: SharedSpaceOwnerDto;
  @ApiProperty({ enum: ESpaceShareRole }) role: ESpaceShareRole;

  constructor(args: {
    space: SpaceDto;
    lists: Array<ListDto>;
    owner: SharedSpaceOwnerDto;
    role: ESpaceShareRole;
  }) {
    this.space = args.space;
    this.lists = args.lists;
    this.owner = args.owner;
    this.role = args.role;
  }
}
