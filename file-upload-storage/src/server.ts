import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import { LocalStorageProvider, CloudStorageProvider } from './storage/providers';
import { MemoryFileStore } from './storage/filestore';
import { createUploadRoutes } from './routes/upload';
import { createFileRoutes } from './routes/files';

const storage = new LocalStorageProvider('./uploads');
const fileStore = new MemoryFileStore();

const app = createServer();

app.get('/', async (_req: VerbRequest, res: VerbResponse) => {
  return res.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Upload Demo</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-section { border: 2px dashed #ccc; padding: 30px; margin: 20px 0; text-align: center; }
        .upload-section.dragover { border-color: #007bff; background: #f8f9fa; }
        .file-list { margin: 20px 0; }
        .file-item { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; }
        .btn { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .form-group { margin: 10px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .progress { width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-bar { height: 100%; background: #007bff; transition: width 0.3s; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .gallery-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .gallery-item img { width: 100%; height: 150px; object-fit: cover; }
        .gallery-item-info { padding: 10px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>📁 File Upload Demo</h1>
    
    <div class="upload-section" id="dropZone">
        <h3>Drop files here or click to select</h3>
        <input type="file" id="fileInput" multiple style="display: none;">
        <button class="btn" onclick="document.getElementById('fileInput').click()">Select Files</button>
    </div>

    <div class="form-group">
        <label>Tags (comma-separated):</label>
        <input type="text" id="tags" placeholder="photo, document, important">
    </div>
    
    <div class="form-group">
        <label>
            <input type="checkbox" id="isPublic"> Make files public
        </label>
    </div>

    <div class="form-group">
        <button class="btn" onclick="uploadFiles()">Upload Selected Files</button>
    </div>

    <div class="progress" id="progressBar" style="display: none;">
        <div class="progress-bar" id="progress"></div>
    </div>

    <div id="results"></div>

    <h2>📊 Uploaded Files</h2>
    <button class="btn" onclick="loadFiles()">Refresh File List</button>
    <div id="fileList" class="file-list"></div>

    <h2>🖼️ Image Gallery</h2>
    <div id="gallery" class="gallery"></div>

    <script>
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        let selectedFiles = [];

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            selectedFiles = files;
            updateFileDisplay();
        });

        fileInput.addEventListener('change', (e) => {
            selectedFiles = Array.from(e.target.files);
            updateFileDisplay();
        });

        function updateFileDisplay() {
            const display = selectedFiles.map(f => 
                \`<div class="file-item">\${f.name} (\${(f.size/1024).toFixed(1)}KB)</div>\`
            ).join('');
            document.getElementById('dropZone').innerHTML = 
                \`<h3>\${selectedFiles.length} files selected</h3>\` + display +
                \`<button class="btn" onclick="document.getElementById('fileInput').click()">Add More</button>\`;
        }

        async function uploadFiles() {
            if (selectedFiles.length === 0) {
                alert('Please select files first');
                return;
            }

            const formData = new FormData();
            selectedFiles.forEach(file => formData.append('files', file));
            
            const tags = document.getElementById('tags').value;
            const isPublic = document.getElementById('isPublic').checked;
            
            if (tags) formData.append('tags', tags);
            formData.append('isPublic', isPublic);

            const progressBar = document.getElementById('progressBar');
            const progress = document.getElementById('progress');
            progressBar.style.display = 'block';

            try {
                const response = await fetch('/api/upload/multiple', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                document.getElementById('results').innerHTML = 
                    \`<div class="file-item" style="background: \${result.success ? '#d4edda' : '#f8d7da'}; border-color: \${result.success ? '#c3e6cb' : '#f5c6cb'}">
                        <strong>\${result.success ? '✅' : '❌'} Upload Result:</strong><br>
                        Uploaded: \${result.uploaded || 0} files<br>
                        Failed: \${result.failed || 0} files<br>
                        \${result.errors ? '<br>Errors: ' + JSON.stringify(result.errors, null, 2) : ''}
                    </div>\`;

                if (result.success) {
                    loadFiles();
                    selectedFiles = [];
                    updateFileDisplay();
                }
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    \`<div class="file-item" style="background: #f8d7da; border-color: #f5c6cb">
                        <strong>❌ Upload Error:</strong> \${error.message}
                    </div>\`;
            } finally {
                progressBar.style.display = 'none';
                progress.style.width = '0%';
            }
        }

        async function loadFiles() {
            try {
                const response = await fetch('/api/files');
                const result = await response.json();
                
                if (result.success) {
                    const fileList = document.getElementById('fileList');
                    const gallery = document.getElementById('gallery');
                    
                    fileList.innerHTML = result.files.map(file => 
                        \`<div class="file-item">
                            <strong>\${file.originalName}</strong> 
                            (\${(file.size/1024).toFixed(1)}KB, \${file.mimeType})
                            <br>
                            <small>Uploaded: \${new Date(file.uploadedAt).toLocaleString()}</small>
                            <br>
                            Tags: \${file.tags?.join(', ') || 'None'} | 
                            Public: \${file.isPublic ? 'Yes' : 'No'}
                            <br>
                            <button class="btn" onclick="downloadFile('\${file.id}', '\${file.originalName}')">Download</button>
                            <button class="btn" style="background: #dc3545; margin-left: 5px;" onclick="deleteFile('\${file.id}')">Delete</button>
                        </div>\`
                    ).join('');

                    // Gallery for images
                    const images = result.files.filter(f => f.mimeType.startsWith('image/'));
                    gallery.innerHTML = images.map(file => 
                        \`<div class="gallery-item">
                            <img src="/api/files/\${file.id}/download" alt="\${file.originalName}" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFByZXZpZXc8L3RleHQ+PC9zdmc+'">
                            <div class="gallery-item-info">
                                <strong>\${file.originalName}</strong><br>
                                <small>\${(file.size/1024).toFixed(1)}KB</small>
                            </div>
                        </div>\`
                    ).join('');
                }
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        }

        async function downloadFile(id, filename) {
            window.open(\`/api/files/\${id}/download\`, '_blank');
        }

        async function deleteFile(id) {
            if (!confirm('Are you sure you want to delete this file?')) return;
            
            try {
                const response = await fetch(\`/api/files/\${id}\`, { method: 'DELETE' });
                const result = await response.json();
                
                if (result.success) {
                    loadFiles();
                } else {
                    alert('Failed to delete file: ' + result.error);
                }
            } catch (error) {
                alert('Error deleting file: ' + error.message);
            }
        }

        // Load files on page load
        loadFiles();
    </script>
</body>
</html>
  `);
});

// Upload routes
app.post('/api/upload/single', async (req: VerbRequest, res: VerbResponse) => {
  try {
    if (!req.formData) {
      return res.status(400).json({ error: 'No form data found' });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const options = {
      tags: formData.get('tags')?.toString().split(',').map(t => t.trim()) || [],
      isPublic: formData.get('isPublic') === 'true',
      maxWidth: formData.get('maxWidth') ? parseInt(formData.get('maxWidth').toString()) : undefined,
      maxHeight: formData.get('maxHeight') ? parseInt(formData.get('maxHeight').toString()) : undefined,
      quality: formData.get('quality') ? parseFloat(formData.get('quality').toString()) : undefined,
    };
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = {
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
    const filePath = await storage.save(file, filename);
    const fileUrl = storage.getUrl(filename);

    const metadata = await fileStore.create({
      originalName: file.name,
      filename,
      size: file.size,
      mimeType: file.type,
      path: filePath,
      url: fileUrl,
      checksum: '',
      tags: options.tags,
      isPublic: options.isPublic || false,
    });

    return res.json({
      success: true,
      file: metadata
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
        const uploadedFile = {
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
        const filePath = await storage.save(file, filename);
        const fileUrl = storage.getUrl(filename);

        const metadata = await fileStore.create({
          originalName: file.name,
          filename,
          size: file.size,
          mimeType: file.type,
          path: filePath,
          url: fileUrl,
          checksum: '',
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

// File management routes
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
      headers: {
        'Content-Disposition': `attachment; filename="${fileMetadata.originalName}"`,
        'Content-Type': fileMetadata.mimeType,
        'Content-Length': fileMetadata.size.toString()
      }
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

app.get('/api/stats', async (_req: VerbRequest, res: VerbResponse) => {
  try {
    const stats = (fileStore as any).getStats ? (fileStore as any).getStats() : {
      totalFiles: 0,
      totalSize: 0,
      publicFiles: 0,
      mimeTypes: []
    };

    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const port = 3000;
app.withOptions({
  port,
  hostname: 'localhost',
  development: {
    hmr: true,
    console: true
  }
});

app.listen();

console.log('🚀 File Upload Demo Server Running');
console.log(`📁 Access at: http://localhost:${port}`);
console.log('');
console.log('API Endpoints:');
console.log('  POST /api/upload/single   - Single file upload');
console.log('  POST /api/upload/multiple - Multiple file upload');
console.log('  GET  /api/files          - List all files');
console.log('  GET  /api/files/:id      - Get file metadata');
console.log('  GET  /api/files/:id/download - Download file');
console.log('  DELETE /api/files/:id    - Delete file');
console.log('  PATCH /api/files/:id     - Update file metadata');
console.log('  GET  /api/stats          - Get upload statistics');