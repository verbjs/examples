# Blog/CMS Example

A complete blog and content management system with admin panel built with Verb, demonstrating fullstack capabilities.

## Features

- ✅ Public blog with post listing and reading
- ✅ Admin panel for content management
- ✅ Post creation, editing, and publishing
- ✅ Category and tag management
- ✅ Media library with image uploads
- ✅ User management and authentication
- ✅ SEO-friendly URLs and metadata
- ✅ Comment system with moderation
- ✅ Rich text editor integration
- ✅ Responsive design

## Routes

### Public Blog
- `GET /` - Blog homepage with latest posts
- `GET /posts/:slug` - Individual post view
- `GET /category/:slug` - Posts by category
- `GET /tag/:slug` - Posts by tag
- `GET /search` - Search posts

### Admin Panel
- `GET /admin` - Admin dashboard
- `GET /admin/posts` - Manage posts
- `GET /admin/posts/new` - Create new post
- `GET /admin/posts/:id/edit` - Edit post
- `GET /admin/categories` - Manage categories
- `GET /admin/media` - Media library
- `GET /admin/users` - User management

### API Endpoints
- `GET /api/posts` - List posts (with filters)
- `POST /api/posts` - Create post (admin)
- `PUT /api/posts/:id` - Update post (admin)
- `DELETE /api/posts/:id` - Delete post (admin)
- `POST /api/auth/login` - Admin login
- `POST /api/uploads` - Upload media

## Quick Start

```bash
bun install
bun run dev
```

- Blog: http://localhost:3000
- Admin: http://localhost:3000/admin

## Default Admin

- Email: admin@blog.com
- Password: admin123