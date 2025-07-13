# File Upload with Storage Example

A comprehensive file upload example demonstrating secure file handling, validation, storage strategies, and file management with Verb.

## Features

- ✅ Secure file uploads with validation
- ✅ Multiple storage backends (local, cloud simulation)
- ✅ File type validation by magic numbers
- ✅ Progress tracking for large files
- ✅ Image resizing and optimization
- ✅ File metadata storage
- ✅ Upload management (list, delete, download)
- ✅ Security best practices (filename sanitization, size limits)

## Endpoints

### Upload Operations
- `POST /api/upload/single` - Single file upload
- `POST /api/upload/multiple` - Multiple file upload
- `POST /api/upload/avatar` - Avatar upload with image processing

### File Management
- `GET /api/files` - List all uploaded files
- `GET /api/files/:id` - Get file metadata
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Frontend
- `GET /` - Upload interface
- `GET /gallery` - File gallery view

## Security Features

- File type validation using magic numbers
- Filename sanitization
- Size limits per file and total request
- Virus scanning hook (placeholder)
- Path traversal protection

## Quick Start

```bash
bun install
bun run dev
```

Then visit http://localhost:3000 to see the upload interface.