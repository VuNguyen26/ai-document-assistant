import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces-query.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

const WORKSPACE_DOCUMENT_SELECT = {
  id: true,
  title: true,
  originalFilename: true,
  status: true,
  sourceLanguage: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DocumentSelect;

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const name = dto.name.trim();
    const description = dto.description?.trim() || null;

    if (!name) {
      throw new BadRequestException('Tên workspace không được để trống');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        userId,
        name,
        description,
      },
      include: {
        documents: {
          include: {
            document: {
              select: WORKSPACE_DOCUMENT_SELECT,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return this.serializeWorkspaceDetail(workspace);
  }

  async listWorkspaces(userId: string, query: ListWorkspacesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.WorkspaceWhereInput = {
      userId,
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          documents: {
            include: {
              document: {
                select: WORKSPACE_DOCUMENT_SELECT,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeWorkspaceCard(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / limit),
      },
    };
  }

  async getWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.findOwnedWorkspaceOrThrow(userId, workspaceId);
    return this.serializeWorkspaceDetail(workspace);
  }

  async updateWorkspace(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ) {
    const existing = await this.findOwnedWorkspaceOrThrow(userId, workspaceId);

    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    const description =
      dto.description !== undefined
        ? dto.description.trim() || null
        : existing.description;

    if (!name) {
      throw new BadRequestException('Tên workspace không được để trống');
    }

    const updated = await this.prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        name,
        description,
      },
      include: {
        documents: {
          include: {
            document: {
              select: WORKSPACE_DOCUMENT_SELECT,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return this.serializeWorkspaceDetail(updated);
  }

  async deleteWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this workspace',
      );
    }

    await this.prisma.workspace.delete({
      where: {
        id: workspaceId,
      },
    });

    return {
      id: workspaceId,
    };
  }

  async addDocumentToWorkspace(
    userId: string,
    workspaceId: string,
    documentId: string,
  ) {
    await this.findOwnedWorkspaceOrThrow(userId, workspaceId);
    await this.findOwnedDocumentOrThrow(userId, documentId);

    const existingLink = await this.prisma.workspaceDocument.findUnique({
      where: {
        workspaceId_documentId: {
          workspaceId,
          documentId,
        },
      },
    });

    if (existingLink) {
      throw new BadRequestException('Tài liệu đã có trong workspace này');
    }

    await this.prisma.workspaceDocument.create({
      data: {
        workspaceId,
        documentId,
      },
    });

    const updated = await this.findOwnedWorkspaceOrThrow(userId, workspaceId);
    return this.serializeWorkspaceDetail(updated);
  }

  async removeDocumentFromWorkspace(
    userId: string,
    workspaceId: string,
    documentId: string,
  ) {
    await this.findOwnedWorkspaceOrThrow(userId, workspaceId);

    const existingLink = await this.prisma.workspaceDocument.findUnique({
      where: {
        workspaceId_documentId: {
          workspaceId,
          documentId,
        },
      },
    });

    if (!existingLink) {
      throw new NotFoundException('Document is not in this workspace');
    }

    await this.prisma.workspaceDocument.delete({
      where: {
        workspaceId_documentId: {
          workspaceId,
          documentId,
        },
      },
    });

    const updated = await this.findOwnedWorkspaceOrThrow(userId, workspaceId);
    return this.serializeWorkspaceDetail(updated);
  }

  private async findOwnedWorkspaceOrThrow(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId,
      },
      include: {
        documents: {
          include: {
            document: {
              select: WORKSPACE_DOCUMENT_SELECT,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  private async findOwnedDocumentOrThrow(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private serializeWorkspaceCard(
    item: Prisma.WorkspaceGetPayload<{
      include: {
        documents: {
          include: {
            document: {
              select: typeof WORKSPACE_DOCUMENT_SELECT;
            };
          };
        };
      };
    }>,
  ) {
    const documents = item.documents
      .map((link) => link.document)
      .filter((document) => document.status !== DocumentStatus.DELETED);

    const readyDocumentsCount = documents.filter(
      (document) => document.status === DocumentStatus.READY,
    ).length;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      documentsCount: documents.length,
      readyDocumentsCount,
      incompleteDocumentsCount: documents.length - readyDocumentsCount,
      documentsPreview: documents.slice(0, 3).map((document) => ({
        id: document.id,
        title: document.title,
        originalFilename: document.originalFilename,
        status: document.status,
      })),
    };
  }

  private serializeWorkspaceDetail(
    item: Prisma.WorkspaceGetPayload<{
      include: {
        documents: {
          include: {
            document: {
              select: typeof WORKSPACE_DOCUMENT_SELECT;
            };
          };
        };
      };
    }>,
  ) {
    const documents = item.documents
      .map((link) => link.document)
      .filter((document) => document.status !== DocumentStatus.DELETED)
      .map((document) => ({
        id: document.id,
        title: document.title,
        originalFilename: document.originalFilename,
        status: document.status,
        sourceLanguage: document.sourceLanguage,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }));

    const readyDocumentsCount = documents.filter(
      (document) => document.status === DocumentStatus.READY,
    ).length;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      documentsCount: documents.length,
      readyDocumentsCount,
      incompleteDocumentsCount: documents.length - readyDocumentsCount,
      documents,
    };
  }
}