export type WorkspacePreviewDocument = {
  id: string;
  title: string;
  originalFilename: string;
  status: string;
};

export type WorkspaceDocument = {
  id: string;
  title: string;
  originalFilename: string;
  status: string;
  sourceLanguage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  documentsCount: number;
  readyDocumentsCount: number;
  incompleteDocumentsCount: number;
  documentsPreview: WorkspacePreviewDocument[];
};

export type WorkspaceDetail = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  documentsCount: number;
  readyDocumentsCount: number;
  incompleteDocumentsCount: number;
  documents: WorkspaceDocument[];
};

export type WorkspacesListResponse = {
  items: WorkspaceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateWorkspacePayload = {
  name: string;
  description?: string;
};

export type UpdateWorkspacePayload = {
  name?: string;
  description?: string;
};

export type AddWorkspaceDocumentPayload = {
  documentId: string;
};