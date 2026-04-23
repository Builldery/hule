import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'object' && payload !== null && 'error' in payload) {
        void reply.code(status).send(payload);
        return;
      }
      if (typeof payload === 'string') {
        void reply.code(status).send({ error: exception.name, message: payload });
        return;
      }
      void reply.code(status).send(payload);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    void reply.code(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: 'InternalServerError',
      message: exception instanceof Error ? exception.message : 'Unknown error',
    });
  }
}
