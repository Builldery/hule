import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
@Public()
export class RestApiHealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async ping(): Promise<{ status: string; mongo: 'up' | 'down' }> {
    try {
      const admin = this.connection.db?.admin();
      const res = await admin?.command({ ping: 1 });
      return { status: 'ok', mongo: res?.ok === 1 ? 'up' : 'down' };
    } catch {
      return { status: 'ok', mongo: 'down' };
    }
  }
}
