import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from '../../../domain/modules/workspace/workspace.service';
import { AuthService } from '../../../domain/modules/auth/auth.service';
import { WorkspaceDto } from '../../../domain/entity/workspace/workspace.dto';
import { CreateWorkspaceDto } from '../../../domain/entity/workspace/create-workspace.dto';
import { UpdateWorkspaceDto } from '../../../domain/entity/workspace/update-workspace.dto';
import { InviteMemberDto } from '../../../domain/entity/workspace/invite-member.dto';
import { WorkspaceCreatedDto } from '../../../domain/entity/workspace/workspace-created.dto';
import {
  WorkspaceIdParamsDto,
  WorkspaceMemberParamsDto,
} from '../../../domain/entity/workspace/workspace-params.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/entity/auth/jwt-payload';

@ApiTags('Workspace')
@ApiBearerAuth()
@Controller('workspaces')
export class RestApiWorkspaceController {
  @Inject() workspaceService: WorkspaceService;
  @Inject() authService: AuthService;

  @ApiResponse({ type: [WorkspaceDto] })
  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<Array<WorkspaceDto>> {
    return this.workspaceService.listForUser(user.id);
  }

  @ApiResponse({ type: WorkspaceCreatedDto })
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceCreatedDto> {
    const workspace = await this.workspaceService.create(user.id, dto);
    const access_token = await this.authService.issueTokenForUserId(user.id);
    return new WorkspaceCreatedDto(access_token, workspace);
  }

  @ApiResponse({ type: WorkspaceDto })
  @Get(':workspaceId')
  get(
    @CurrentUser() user: JwtPayload,
    @Param() params: WorkspaceIdParamsDto,
  ): Promise<WorkspaceDto> {
    return this.workspaceService.findByIdForUser(params.workspaceId, user.id);
  }

  @ApiResponse({ type: WorkspaceDto })
  @Patch(':workspaceId')
  rename(
    @CurrentUser() user: JwtPayload,
    @Param() params: WorkspaceIdParamsDto,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    return this.workspaceService.rename(params.workspaceId, user.id, dto);
  }

  @Delete(':workspaceId')
  @HttpCode(204)
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param() params: WorkspaceIdParamsDto,
  ): Promise<void> {
    await this.workspaceService.delete(params.workspaceId, user.id);
  }

  @ApiResponse({ type: WorkspaceDto })
  @Post(':workspaceId/members')
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param() params: WorkspaceIdParamsDto,
    @Body() dto: InviteMemberDto,
  ): Promise<WorkspaceDto> {
    return this.workspaceService.addMember(params.workspaceId, user.id, dto.login);
  }

  @ApiResponse({ type: WorkspaceDto })
  @Delete(':workspaceId/members/:memberId')
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param() params: WorkspaceMemberParamsDto,
  ): Promise<WorkspaceDto> {
    return this.workspaceService.removeMember(
      params.workspaceId,
      user.id,
      params.memberId,
    );
  }
}
