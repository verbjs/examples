import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import type { StorageProvider, FileStore } from '../types';

export const createFileRoutes = (storage: StorageProvider, fileStore: FileStore) => {
  const app = createServer();

  app.get('/api/files', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { tags, isPublic } = req.query || {};
      
      const filters: any = {};
      if (tags) {
        filters.tags = tags.toString().split(',').map(t => t.trim());
      }
      if (isPublic !== undefined) {
        filters.isPublic = isPublic === 'true';
      }

      const files = await fileStore.findAll(filters);
      
      return res.json({
        success: true,
        count: files.length,
        files: files.map(file => ({
          ...file,
          uploadedAt: file.uploadedAt.toISOString(),
        }))
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/files/:id', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const file = await fileStore.findById(id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      return res.json({
        success: true,
        file: {
          ...file,
          uploadedAt: file.uploadedAt.toISOString(),
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to get file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/files/:id/download', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const fileMetadata = await fileStore.findById(id);
      if (!fileMetadata) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = await storage.get(fileMetadata.filename);
      if (!file) {
        return res.status(404).json({ error: 'File content not found' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.originalName}"`);
      res.setHeader('Content-Type', fileMetadata.mimeType);
      res.setHeader('Content-Length', fileMetadata.size.toString());
      
      return new Response(file.stream(), {
        headers: res.getHeaders(),
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete('/api/files/:id', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const fileMetadata = await fileStore.findById(id);
      if (!fileMetadata) {
        return res.status(404).json({ error: 'File not found' });
      }

      const storageDeleted = await storage.delete(fileMetadata.filename);
      const metadataDeleted = await fileStore.delete(id);

      if (!metadataDeleted) {
        return res.status(500).json({ error: 'Failed to delete file metadata' });
      }

      return res.json({
        success: true,
        message: 'File deleted successfully',
        storageDeleted,
        metadataDeleted
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch('/api/files/:id', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const updates = await req.json();
      const allowedUpdates = ['tags', 'isPublic'];
      const filteredUpdates: any = {};

      for (const key of allowedUpdates) {
        if (key in updates) {
          filteredUpdates[key] = updates[key];
        }
      }

      const updatedFile = await fileStore.update(id, filteredUpdates);
      if (!updatedFile) {
        return res.status(404).json({ error: 'File not found' });
      }

      return res.json({
        success: true,
        file: {
          ...updatedFile,
          uploadedAt: updatedFile.uploadedAt.toISOString(),
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to update file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
};