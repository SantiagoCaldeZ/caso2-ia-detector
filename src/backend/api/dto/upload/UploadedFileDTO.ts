export interface UploadedFileDTO {
  id: string;
  originalFileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}
