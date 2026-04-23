import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpaceService } from '../../../domain/modules/space/space.service';
import { SpaceDto } from '../../../domain/entity/space/space.dto';
import { CreateSpaceDto } from '../../../domain/entity/space/create-space.dto';
import { UpdateSpaceDto } from '../../../domain/entity/space/update-space.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { ReorderItemDto } from '../../../domain/entity/common/reorder.dto';

@ApiTags('Space')
@Controller('spaces')
export class RestApiSpaceController {
  @Inject() spaceService: SpaceService;

  @ApiResponse({ type: [SpaceDto] })
  @Get()
  getAll(): Promise<Array<SpaceDto>> {
    return this.spaceService.getAll();
  }

  @ApiResponse({ type: SpaceDto })
  @Post()
  create(@Body() dto: CreateSpaceDto): Promise<SpaceDto> {
    return this.spaceService.create(dto);
  }

  @ApiResponse({ type: SpaceDto })
  @Patch(':id')
  update(@Param() params: IdParamsDto, @Body() patch: UpdateSpaceDto): Promise<SpaceDto> {
    return this.spaceService.update(params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param() params: IdParamsDto): Promise<void> {
    await this.spaceService.delete(params.id);
  }

  @Post('reorder')
  @HttpCode(204)
  async reorder(
    @Body(new ParseArrayPipe({ items: ReorderItemDto, whitelist: true }))
    items: Array<ReorderItemDto>,
  ): Promise<void> {
    await this.spaceService.reorder(items);
  }
}
