export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  path: string;
  url: string;
  checksum?: string;
  tags?: string[];
  isPublic: boolean;
}

export interface UploadOptions {
  tags?: string[];
  isPublic?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface StorageProvider {
  save(file: Blob, filename: string, options?: any): Promise<string>;
  get(filename: string): Promise<Blob | null>;
  delete(filename: string): Promise<boolean>;
  getUrl(filename: string): string;
}

export interface FileStore {
  create(metadata: Omit<FileMetadata, 'id' | 'uploadedAt'>): Promise<FileMetadata>;
  findById(id: string): Promise<FileMetadata | null>;
  findAll(filters?: { tags?: string[]; isPublic?: boolean }): Promise<FileMetadata[]>;
  update(id: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null>;
  delete(id: string): Promise<boolean>;
}