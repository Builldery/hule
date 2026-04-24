import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    WorkspaceModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          new Logger('AuthModule').warn(
            'JWT_SECRET is not set; falling back to "dev-secret-change-me". Do NOT use in production.',
          );
        }
        return {
          secret: secret ?? 'dev-secret-change-me',
          signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '30d') as any },
        };
      },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
