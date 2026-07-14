import { IsUUID } from 'class-validator';

export class AddWorkspaceDocumentDto {
  @IsUUID('4', { message: 'documentId phải là UUID hợp lệ' })
  documentId: string;
}
