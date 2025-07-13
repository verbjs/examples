import type { FileMetadata, FileStore } from '../types';

export class MemoryFileStore implements FileStore {
  private files = new Map<string, FileMetadata>();

  async create(metadata: Omit<FileMetadata, 'id' | 'uploadedAt'>): Promise<FileMetadata> {
    const fileMetadata: FileMetadata = {
      ...metadata,
      id: crypto.randomUUID(),
      uploadedAt: new Date(),
    };
    
    this.files.set(fileMetadata.id, fileMetadata);
    return fileMetadata;
  }

  async findById(id: string): Promise<FileMetadata | null> {
    return this.files.get(id) || null;
  }

  async findAll(filters?: { tags?: string[]; isPublic?: boolean }): Promise<FileMetadata[]> {
    let files = Array.from(this.files.values());
    
    if (filters?.isPublic !== undefined) {
      files = files.filter(f => f.isPublic === filters.isPublic);
    }
    
    if (filters?.tags?.length) {
      files = files.filter(f => 
        filters.tags!.every(tag => f.tags?.includes(tag))
      );
    }
    
    return files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async update(id: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null> {
    const existing = this.files.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    this.files.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.files.delete(id);
  }

  getStats() {
    const files = Array.from(this.files.values());
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      publicFiles: files.filter(f => f.isPublic).length,
      mimeTypes: [...new Set(files.map(f => f.mimeType))]
    };
  }
}