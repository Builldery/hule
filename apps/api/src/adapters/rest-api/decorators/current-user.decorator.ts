import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req?.user as JwtPayload | undefined;
  },
);
