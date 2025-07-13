import { createServer, validateFile, generateUniqueFileName, type UploadedFile } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import type { FileMetadata, UploadOptions, StorageProvider, FileStore } from '../types';
import { isImageFile, generateThumbnail, getImageDimensions, calculateChecksum } from '../utils/image';

export const createUploadRoutes = (storage: StorageProvider, fileStore: FileStore) => {
  const app = createServer();

  app.post('/api/upload/single', async (req: VerbRequest, res: VerbResponse) => {
    try {
      if (!req.formData) {
        return res.status(400).json({ error: 'No form data found' });
      }

      const formData = await req.formData();
      const file = formData.get('file') as File;
      const options: UploadOptions = {
        tags: formData.get('tags')?.toString().split(',').map(t => t.trim()) || [],
        isPublic: formData.get('isPublic') === 'true',
        maxWidth: formData.get('maxWidth') ? parseInt(formData.get('maxWidth').toString()) : undefined,
        maxHeight: formData.get('maxHeight') ? parseInt(formData.get('maxHeight').toString()) : undefined,
        quality: formData.get('quality') ? parseFloat(formData.get('quality').toString()) : undefined,
      };
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        content: file,
        arrayBuffer: () => file.arrayBuffer(),
        text: () => file.text(),
        stream: () => file.stream(),
      };

      const validation = validateFile(uploadedFile, {
        maxFileSize: 10 * 1024 * 1024,
        allowedTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain', 'application/json',
          'video/mp4', 'audio/mpeg'
        ]
      });

      if (!validation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          details: validation.errors
        });
      }

      const filename = generateUniqueFileName(file.name);
      const checksum = await calculateChecksum(file);
      
      let processedFile = file;
      let dimensions = null;

      if (isImageFile(file.type)) {
        dimensions = await getImageDimensions(file);
        
        if (options.maxWidth || options.maxHeight) {
          processedFile = await generateThumbnail(
            file, 
            options.maxWidth || 1920, 
            options.maxHeight || 1080,
            options.quality || 0.8
          );
        }
      }

      const filePath = await storage.save(processedFile, filename);
      const fileUrl = storage.getUrl(filename);

      const metadata: FileMetadata = await fileStore.create({
        originalName: file.name,
        filename,
        size: processedFile.size,
        mimeType: file.type,
        path: filePath,
        url: fileUrl,
        checksum,
        tags: options.tags,
        isPublic: options.isPublic || false,
      });

      return res.json({
        success: true,
        file: metadata,
        dimensions,
        processed: processedFile.size !== file.size
      });

    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/upload/multiple', async (req: VerbRequest, res: VerbResponse) => {
    try {
      if (!req.formData) {
        return res.status(400).json({ error: 'No form data found' });
      }

      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      
      if (!files.length) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const uploadedFile: UploadedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            content: file,
            arrayBuffer: () => file.arrayBuffer(),
            text: () => file.text(),
            stream: () => file.stream(),
          };

          const validation = validateFile(uploadedFile, {
            maxFileSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
          });

          if (!validation.valid) {
            errors.push({
              file: file.name,
              errors: validation.errors
            });
            continue;
          }

          const filename = generateUniqueFileName(file.name);
          const checksum = await calculateChecksum(file);
          const filePath = await storage.save(file, filename);
          const fileUrl = storage.getUrl(filename);

          const metadata = await fileStore.create({
            originalName: file.name,
            filename,
            size: file.size,
            mimeType: file.type,
            path: filePath,
            url: fileUrl,
            checksum,
            tags: [],
            isPublic: false,
          });

          results.push(metadata);
        } catch (error) {
          errors.push({
            file: file.name,
            error: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      }

      return res.json({
        success: true,
        uploaded: results.length,
        failed: errors.length,
        files: results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      return res.status(500).json({
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
};