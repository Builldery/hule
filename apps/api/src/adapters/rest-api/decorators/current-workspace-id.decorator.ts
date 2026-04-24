import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentWorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const wsId: unknown = req?.params?.workspaceId;
    if (typeof wsId !== 'string' || !wsId) {
      throw new Error('workspaceId path param missing');
    }
    return wsId;
  },
);
