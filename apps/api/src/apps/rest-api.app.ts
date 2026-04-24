import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyMultipart from '@fastify/multipart';

import { RestApiModule } from '../adapters/rest-api/rest-api.module';
import { AllExceptionsFilter } from '../adapters/rest-api/filters/all-exceptions.filter';
import { validationExceptionFactory } from '../adapters/rest-api/pipes/validation-exception.factory';

export class RestApiApp {
  PORT = Number(process.env.PORT ?? 3000);
  BASE_PATH = process.env.BASE_PATH ?? 'api';
  app!: NestFastifyApplication;

  static async bootstrap(): Promise<void> {
    const app = await new RestApiApp().init();
    await app.useMultipart();
    await app
      .usePipes()
      .useFilters()
      .useCors()
      .useDocumentation()
      .listen();
  }

  coreModule(): typeof RestApiModule {
    return RestApiModule;
  }

  async init(): Promise<this> {
    this.app = await NestFactory.create<NestFastifyApplication>(
      this.coreModule(),
      new FastifyAdapter({ maxParamLength: 1000 }),
      { bufferLogs: false },
    );
    this.app.setGlobalPrefix(this.BASE_PATH);
    this.app.enableShutdownHooks();
    return this;
  }

  async useMultipart(): Promise<this> {
    await this.app
      .getHttpAdapter()
      .getInstance()
      .register(fastifyMultipart as any, {
        limits: { fileSize: 25 * 1024 * 1024, files: 10 },
      });
    return this;
  }

  usePipes(): this {
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    return this;
  }

  useFilters(): this {
    this.app.useGlobalFilters(new AllExceptionsFilter());
    return this;
  }

  useCors(): this {
    this.app.enableCors();
    return this;
  }

  useDocumentation(): this {
    const config = new DocumentBuilder()
      .setTitle('Hule API')
      .setDescription('Personal ClickUp alternative — REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup(`${this.BASE_PATH}/documentation`, this.app, document);
    return this;
  }

  async listen(): Promise<this> {
    await this.app.listen({ port: this.PORT, host: '0.0.0.0' });
    return this;
  }
}
