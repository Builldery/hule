import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpaceShareService } from '../../../domain/modules/space-share/space-share.service';
import { SpaceDto } from '../../../domain/entity/space/space.dto';
import { ShareSpaceDto } from '../../../domain/entity/space/share-space.dto';
import {
  SpaceIdParamsDto,
  SpaceShareTargetParamsDto,
} from '../../../domain/entity/space/space-params.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@ApiTags('SpaceShare')
@ApiBearerAuth()
@Controller('spaces/:spaceId/shares')
export class RestApiSpaceShareController {
  @Inject() spaceShareService: SpaceShareService;

  @ApiResponse({ type: SpaceDto })
  @Post()
  share(
    @CurrentUser() user: JwtPayload,
    @Param() params: SpaceIdParamsDto,
    @Body() dto: ShareSpaceDto,
  ): Promise<SpaceDto> {
    return this.spaceShareService.share(user.id, params.spaceId, dto);
  }

  @ApiResponse({ type: SpaceDto })
  @Delete(':userId')
  @HttpCode(200)
  unshare(
    @CurrentUser() user: JwtPayload,
    @Param() params: SpaceShareTargetParamsDto,
  ): Promise<SpaceDto> {
    return this.spaceShareService.unshare(
      user.id,
      params.spaceId,
      params.userId,
    );
  }
}
