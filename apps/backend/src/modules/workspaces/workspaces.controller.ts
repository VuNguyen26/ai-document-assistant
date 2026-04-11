import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AddWorkspaceDocumentDto } from './dto/add-workspace-document.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces-query.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const data = await this.workspacesService.createWorkspace(user.id, dto);

    return {
      success: true,
      message: 'Workspace created successfully',
      data,
    };
  }

  @Get()
  async listWorkspaces(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListWorkspacesQueryDto,
  ) {
    const data = await this.workspacesService.listWorkspaces(user.id, query);

    return {
      success: true,
      message: 'Workspaces fetched successfully',
      data,
    };
  }

  @Get(':id')
  async getWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const data = await this.workspacesService.getWorkspace(user.id, id);

    return {
      success: true,
      message: 'Workspace fetched successfully',
      data,
    };
  }

  @Patch(':id')
  async updateWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const data = await this.workspacesService.updateWorkspace(user.id, id, dto);

    return {
      success: true,
      message: 'Workspace updated successfully',
      data,
    };
  }

  @Delete(':id')
  async deleteWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const data = await this.workspacesService.deleteWorkspace(user.id, id);

    return {
      success: true,
      message: 'Workspace deleted successfully',
      data,
    };
  }

  @Post(':id/documents')
  async addDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddWorkspaceDocumentDto,
  ) {
    const data = await this.workspacesService.addDocumentToWorkspace(
      user.id,
      id,
      dto.documentId,
    );

    return {
      success: true,
      message: 'Document added to workspace successfully',
      data,
    };
  }

  @Delete(':id/documents/:documentId')
  async removeDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
  ) {
    const data = await this.workspacesService.removeDocumentFromWorkspace(
      user.id,
      id,
      documentId,
    );

    return {
      success: true,
      message: 'Document removed from workspace successfully',
      data,
    };
  }
}