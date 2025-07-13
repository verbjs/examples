import type { StorageProvider } from '../types';

export class LocalStorageProvider implements StorageProvider {
  constructor(private uploadDir: string = './uploads') {}

  async save(file: Blob, filename: string): Promise<string> {
    const filePath = `${this.uploadDir}/${filename}`;
    await Bun.write(filePath, file);
    return filePath;
  }

  async get(filename: string): Promise<Blob | null> {
    try {
      const file = Bun.file(`${this.uploadDir}/${filename}`);
      return await file.exists() ? file : null;
    } catch {
      return null;
    }
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const file = Bun.file(`${this.uploadDir}/${filename}`);
      if (await file.exists()) {
        await Bun.write(`${this.uploadDir}/${filename}`, new Uint8Array(0));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getUrl(filename: string): string {
    return `/api/files/download/${filename}`;
  }
}

export class CloudStorageProvider implements StorageProvider {
  constructor(private bucket: string, private region: string = 'us-east-1') {}

  async save(file: Blob, filename: string, options?: any): Promise<string> {
    console.log(`[Cloud] Uploading ${filename} to ${this.bucket}`);
    
    const cloudPath = `${this.region}/${this.bucket}/${filename}`;
    return cloudPath;
  }

  async get(filename: string): Promise<Blob | null> {
    console.log(`[Cloud] Fetching ${filename} from ${this.bucket}`);
    return null;
  }

  async delete(filename: string): Promise<boolean> {
    console.log(`[Cloud] Deleting ${filename} from ${this.bucket}`);
    return true;
  }

  getUrl(filename: string): string {
    return `https://${this.bucket}.${this.region}.cloud.example.com/${filename}`;
  }
}