export interface CreateVerificationRequestDTO {
  inputType: 'TEXT' | 'URL' | 'IMAGE';
  text?: string;
  url?: string;
  uploadedFileId?: string;
}