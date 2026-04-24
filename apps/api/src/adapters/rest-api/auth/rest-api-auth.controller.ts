import { Body, Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../../domain/modules/auth/auth.service';
import { UserService } from '../../../domain/modules/user/user.service';
import { CreateUserDto } from '../../../domain/entity/user/create-user.dto';
import { LoginDto } from '../../../domain/entity/auth/login.dto';
import { AuthResponseDto } from '../../../domain/entity/auth/auth-response.dto';
import { UserDto } from '../../../domain/entity/user/user.dto';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@ApiTags('Auth')
@Controller('auth')
export class RestApiAuthController {
  @Inject() authService: AuthService;
  @Inject() userService: UserService;

  @Public()
  @ApiResponse({ type: AuthResponseDto })
  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(200)
  @ApiResponse({ type: AuthResponseDto })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @ApiResponse({ type: UserDto })
  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<UserDto> {
    return this.userService.findById(user.id);
  }
}
