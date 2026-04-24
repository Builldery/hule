import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../../../domain/modules/auth/auth.module';
import { UserModule } from '../../../domain/modules/user/user.module';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RestApiAuthController } from './rest-api-auth.controller';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [RestApiAuthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class RestApiAuthModule {}
