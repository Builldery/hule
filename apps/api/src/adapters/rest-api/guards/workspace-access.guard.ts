import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const wsId: unknown = req?.params?.workspaceId;
    if (typeof wsId !== 'string' || !wsId) return true;

    const user = req?.user as JwtPayload | undefined;
    if (!user) throw new ForbiddenException('Workspace access denied');
    if (!Array.isArray(user.workspaceIds) || !user.workspaceIds.includes(wsId)) {
      throw new ForbiddenException('Workspace access denied');
    }
    return true;
  }
}
