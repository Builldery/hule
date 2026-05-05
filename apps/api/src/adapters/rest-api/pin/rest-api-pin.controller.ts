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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PinService } from '../../../domain/modules/pin/pin.service';
import { PinDto } from '../../../domain/entity/pin/pin.dto';
import { CreatePinDto } from '../../../domain/entity/pin/create-pin.dto';
import { UpdatePinDto } from '../../../domain/entity/pin/update-pin.dto';
import { IdParamsDto } from '../../../domain/entity/common/id-params.dto';
import { ReorderItemDto } from '../../../domain/entity/common/reorder.dto';
import { CurrentWorkspaceId } from '../decorators/current-workspace-id.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@ApiTags('Pin')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/pins')
export class RestApiPinController {
  @Inject() pinService: PinService;

  @ApiResponse({ type: [PinDto] })
  @Get()
  getAll(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Array<PinDto>> {
    return this.pinService.getAll(wsId, user.id);
  }

  @ApiResponse({ type: PinDto })
  @Post()
  create(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePinDto,
  ): Promise<PinDto> {
    return this.pinService.create(wsId, user.id, dto);
  }

  @ApiResponse({ type: PinDto })
  @Patch(':id')
  update(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Param() params: IdParamsDto,
    @Body() patch: UpdatePinDto,
  ): Promise<PinDto> {
    return this.pinService.update(wsId, user.id, params.id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Param() params: IdParamsDto,
  ): Promise<void> {
    await this.pinService.delete(wsId, user.id, params.id);
  }

  @Post('reorder')
  @HttpCode(204)
  async reorder(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ParseArrayPipe({ items: ReorderItemDto, whitelist: true }))
    items: Array<ReorderItemDto>,
  ): Promise<void> {
    await this.pinService.reorder(wsId, user.id, items);
  }
}
