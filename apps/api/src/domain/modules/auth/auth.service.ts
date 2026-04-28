import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { UserDto } from '../../entity/user/user.dto';
import { CreateUserDto } from '../../entity/user/create-user.dto';
import { LoginDto } from '../../entity/auth/login.dto';
import { AuthResponseDto } from '../../entity/auth/auth-response.dto';
import { JwtPayload } from '../../entity/auth/jwt-payload';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly workspaceService: WorkspaceService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResponseDto> {
    if (!dto?.password) throw new BadRequestException('Password required');
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const doc = await this.userService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    const user = new UserDto(doc);
    await this.workspaceService.create(user.id, {
      name: `${user.name}'s workspace`,
    });
    return this.buildResponseForUser(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const doc = await this.userService.findByEmail(dto.email);
    if (!doc) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, doc.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const user = new UserDto(doc);
    return this.buildResponseForUser(user);
  }

  async issueTokenForUserId(userId: string): Promise<string> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const workspaceIds = await this.workspaceService.listIdsForUser(user.id);
    return this.signToken(user, workspaceIds);
  }

  private async buildResponseForUser(user: UserDto): Promise<AuthResponseDto> {
    const workspaceIds = await this.workspaceService.listIdsForUser(user.id);
    return new AuthResponseDto(this.signToken(user, workspaceIds), user);
  }

  private signToken(user: UserDto, workspaceIds: Array<string>): string {
    const payload: JwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      workspaceIds,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return this.jwtService.sign(payload);
  }
}
