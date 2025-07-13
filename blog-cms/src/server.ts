import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import { BlogStore } from './models/store';
import type { User } from './types';

const store = new BlogStore();
const app = createServer();

// Middleware to parse sessions
const getUser = async (req: VerbRequest): Promise<User | null> => {
  const cookieHeader = req.headers.get('cookie');
  const sessionCookie = cookieHeader?.match(/session=([^;]+)/)?.[1];
  if (!sessionCookie) return null;
  
  const session = store.getSessionByToken(sessionCookie);
  if (!session) return null;
  
  return store.getUserById(session.userId);
};

// Helper to render HTML template
const renderTemplate = (title: string, content: string, user?: User | null): string => {
  const settings = store.getSettings();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${settings.siteName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        header { background: #2c3e50; color: white; padding: 1rem 0; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo h1 { font-size: 1.8rem; }
        .tagline { color: #bdc3c7; font-size: 0.9rem; }
        nav ul { list-style: none; display: flex; gap: 2rem; }
        nav a { color: white; text-decoration: none; }
        nav a:hover { color: #3498db; }
        main { padding: 2rem 0; min-height: 500px; }
        .admin-bar { background: #e74c3c; color: white; padding: 0.5rem 0; text-align: center; }
        .admin-bar a { color: white; }
        footer { background: #34495e; color: white; padding: 2rem 0; text-align: center; }
        .post { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }
        .post h2 { margin-bottom: 0.5rem; }
        .post h2 a { color: #2c3e50; text-decoration: none; }
        .post h2 a:hover { color: #3498db; }
        .post-meta { color: #7f8c8d; font-size: 0.9rem; margin-bottom: 1rem; }
        .post-content { margin-bottom: 1rem; }
        .post-tags { display: flex; gap: 0.5rem; }
        .tag { background: #ecf0f1; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.8rem; }
        .sticky { border-left: 4px solid #f39c12; padding-left: 1rem; }
        .btn { background: #3498db; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; display: inline-block; border: none; cursor: pointer; }
        .btn:hover { background: #2980b9; }
        .btn-secondary { background: #95a5a6; }
        .btn-danger { background: #e74c3c; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        .form-group textarea { height: 300px; resize: vertical; }
        .sidebar { background: #f8f9fa; padding: 1.5rem; border-radius: 4px; }
        .sidebar h3 { margin-bottom: 1rem; color: #2c3e50; }
        .sidebar ul { list-style: none; }
        .sidebar li { margin-bottom: 0.5rem; }
        .sidebar a { color: #7f8c8d; text-decoration: none; }
        .sidebar a:hover { color: #2c3e50; }
        .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        .admin-nav { background: #34495e; padding: 1rem 0; }
        .admin-nav ul { display: flex; gap: 2rem; }
        .admin-nav a { color: white; text-decoration: none; }
        .admin-nav a:hover, .admin-nav a.active { color: #3498db; }
        .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: bold; }
        .table tr:hover { background: #f8f9fa; }
        .status-published { color: #27ae60; }
        .status-draft { color: #f39c12; }
        .status-archived { color: #95a5a6; }
        .alert { padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .pagination { display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem; }
        .pagination a { padding: 0.5rem 1rem; background: #ecf0f1; color: #2c3e50; text-decoration: none; border-radius: 4px; }
        .pagination a:hover, .pagination a.active { background: #3498db; color: white; }
    </style>
</head>
<body>
    ${user && user.role === 'admin' ? `
    <div class="admin-bar">
        <div class="container">
            Admin logged in - <a href="/admin">Dashboard</a> | <a href="/api/auth/logout">Logout</a>
        </div>
    </div>` : ''}
    
    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <h1><a href="/" style="color: white; text-decoration: none;">${settings.siteName}</a></h1>
                    <div class="tagline">${settings.tagline}</div>
                </div>
                <nav>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/categories">Categories</a></li>
                        <li><a href="/tags">Tags</a></li>
                        ${!user ? '<li><a href="/admin/login">Admin</a></li>' : ''}
                    </ul>
                </nav>
            </div>
        </div>
    </header>
    
    <main>
        <div class="container">
            ${content}
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; 2025 ${settings.siteName}. Built with Verb framework.</p>
        </div>
    </footer>
</body>
</html>`;
};

// Public blog routes
app.get('/', async (req: VerbRequest, res: VerbResponse) => {
  const user = await getUser(req);
  const { page = '1' } = req.query || {};
  const currentPage = parseInt(page.toString());
  const postsPerPage = store.getSettings().postsPerPage;
  
  const { posts, total } = store.getPosts({
    status: 'published',
    limit: postsPerPage,
    offset: (currentPage - 1) * postsPerPage,
    includeSticky: currentPage === 1
  });

  const categories = store.getCategories().filter(c => c.postCount > 0);
  const tags = store.getTags().filter(t => t.postCount > 0).slice(0, 20);

  const postsHtml = posts.map(post => {
    const author = store.getUserById(post.authorId);
    const category = post.categoryId ? store.getCategoryById(post.categoryId) : null;
    const postTags = post.tags.map(tagId => store.getTags().find(t => t.id === tagId)).filter(Boolean);
    
    return `
    <article class="post ${post.isSticky ? 'sticky' : ''}">
        ${post.isSticky ? '<div style="color: #f39c12; font-weight: bold; margin-bottom: 0.5rem;">📌 Featured Post</div>' : ''}
        <h2><a href="/posts/${post.slug}">${post.title}</a></h2>
        <div class="post-meta">
            By ${author?.name || 'Unknown'} 
            ${category ? ` in <a href="/category/${category.slug}">${category.name}</a>` : ''}
            on ${(post.publishedAt || post.createdAt).toLocaleDateString()}
            ${post.viewCount > 0 ? ` • ${post.viewCount} views` : ''}
        </div>
        <div class="post-content">
            ${post.excerpt || post.content.substring(0, 300) + '...'}
        </div>
        ${postTags.length > 0 ? `
        <div class="post-tags">
            ${postTags.map(tag => `<span class="tag"><a href="/tag/${tag?.slug}">${tag?.name}</a></span>`).join('')}
        </div>` : ''}
    </article>`;
  }).join('');

  const totalPages = Math.ceil(total / postsPerPage);
  const pagination = totalPages > 1 ? `
    <div class="pagination">
        ${currentPage > 1 ? `<a href="?page=${currentPage - 1}">&laquo; Previous</a>` : ''}
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => 
          `<a href="?page=${page}" class="${page === currentPage ? 'active' : ''}">${page}</a>`
        ).join('')}
        ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}">Next &raquo;</a>` : ''}
    </div>` : '';

  const sidebar = `
    <aside class="sidebar">
        <h3>Categories</h3>
        <ul>
            ${categories.map(cat => `<li><a href="/category/${cat.slug}">${cat.name} (${cat.postCount})</a></li>`).join('')}
        </ul>
        
        <h3>Popular Tags</h3>
        <div class="post-tags">
            ${tags.map(tag => `<span class="tag"><a href="/tag/${tag.slug}">${tag.name} (${tag.postCount})</a></span>`).join('')}
        </div>
    </aside>`;

  const content = `
    <div class="grid">
        <div>
            <h1>Latest Posts</h1>
            ${postsHtml || '<p>No posts found.</p>'}
            ${pagination}
        </div>
        ${sidebar}
    </div>`;

  return res.html(renderTemplate('Home', content, user));
});

app.get('/posts/:slug', async (req: VerbRequest, res: VerbResponse) => {
  const user = await getUser(req);
  const { slug } = req.params || {};
  
  if (!slug) {
    return res.status(404).html(renderTemplate('Not Found', '<h1>Post not found</h1>', user));
  }

  const post = store.getPostBySlug(slug);
  if (!post || post.status !== 'published') {
    return res.status(404).html(renderTemplate('Not Found', '<h1>Post not found</h1>', user));
  }

  // Increment view count
  store.incrementPostViews(post.id);

  const author = store.getUserById(post.authorId);
  const category = post.categoryId ? store.getCategoryById(post.categoryId) : null;
  const postTags = post.tags.map(tagId => store.getTags().find(t => t.id === tagId)).filter(Boolean);

  const content = `
    <article class="post">
        <h1>${post.title}</h1>
        <div class="post-meta">
            By ${author?.name || 'Unknown'} 
            ${category ? ` in <a href="/category/${category.slug}">${category.name}</a>` : ''}
            on ${(post.publishedAt || post.createdAt).toLocaleDateString()}
            • ${post.viewCount} views
        </div>
        <div class="post-content">
            ${post.content}
        </div>
        ${postTags.length > 0 ? `
        <div class="post-tags">
            <strong>Tags:</strong>
            ${postTags.map(tag => `<span class="tag"><a href="/tag/${tag?.slug}">${tag?.name}</a></span>`).join('')}
        </div>` : ''}
    </article>
    
    <div style="margin-top: 2rem;">
        <a href="/" class="btn btn-secondary">&laquo; Back to Home</a>
    </div>`;

  return res.html(renderTemplate(post.metaTitle || post.title, content, user));
});

// Admin routes
app.get('/admin/login', async (req: VerbRequest, res: VerbResponse) => {
  const user = await getUser(req);
  if (user) {
    return res.redirect('/admin');
  }

  const content = `
    <div style="max-width: 400px; margin: 2rem auto;">
        <h1>Admin Login</h1>
        <form method="post" action="/api/auth/login">
            <div class="form-group">
                <label>Email:</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Password:</label>
                <input type="password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
        </form>
        
        <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h3>Demo Credentials</h3>
            <p>Email: admin@blog.com</p>
            <p>Password: admin123</p>
        </div>
    </div>`;

  return res.html(renderTemplate('Admin Login', content));
});

app.get('/admin', async (req: VerbRequest, res: VerbResponse) => {
  const user = await getUser(req);
  if (!user || user.role !== 'admin') {
    return res.redirect('/admin/login');
  }

  const { posts: allPosts } = store.getPosts();
  const publishedPosts = allPosts.filter(p => p.status === 'published').length;
  const draftPosts = allPosts.filter(p => p.status === 'draft').length;
  const categories = store.getCategories().length;
  const tags = store.getTags().length;

  const { posts: recentPosts } = store.getPosts({ limit: 5 });

  const content = `
    <div class="admin-nav">
        <div class="container">
            <ul>
                <li><a href="/admin" class="active">Dashboard</a></li>
                <li><a href="/admin/posts">Posts</a></li>
                <li><a href="/admin/categories">Categories</a></li>
                <li><a href="/admin/tags">Tags</a></li>
                <li><a href="/admin/media">Media</a></li>
            </ul>
        </div>
    </div>
    
    <div style="margin-top: 2rem;">
        <h1>Dashboard</h1>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0;">
            <div style="background: #3498db; color: white; padding: 1.5rem; border-radius: 4px; text-align: center;">
                <h3>${publishedPosts}</h3>
                <p>Published Posts</p>
            </div>
            <div style="background: #f39c12; color: white; padding: 1.5rem; border-radius: 4px; text-align: center;">
                <h3>${draftPosts}</h3>
                <p>Draft Posts</p>
            </div>
            <div style="background: #27ae60; color: white; padding: 1.5rem; border-radius: 4px; text-align: center;">
                <h3>${categories}</h3>
                <p>Categories</p>
            </div>
            <div style="background: #9b59b6; color: white; padding: 1.5rem; border-radius: 4px; text-align: center;">
                <h3>${tags}</h3>
                <p>Tags</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
            <div>
                <h2>Recent Posts</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Views</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentPosts.map(post => `
                        <tr>
                            <td><a href="/posts/${post.slug}" target="_blank">${post.title}</a></td>
                            <td><span class="status-${post.status}">${post.status}</span></td>
                            <td>${post.viewCount}</td>
                            <td>${post.createdAt.toLocaleDateString()}</td>
                            <td>
                                <a href="/admin/posts/${post.id}/edit" class="btn" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">Edit</a>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 1rem;">
                    <a href="/admin/posts" class="btn">View All Posts</a>
                    <a href="/admin/posts/new" class="btn" style="margin-left: 0.5rem;">Create New Post</a>
                </div>
            </div>
            
            <div>
                <h2>Quick Actions</h2>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <a href="/admin/posts/new" class="btn">Create New Post</a>
                    <a href="/admin/categories" class="btn btn-secondary">Manage Categories</a>
                    <a href="/admin/media" class="btn btn-secondary">Media Library</a>
                    <a href="/" class="btn btn-secondary">View Site</a>
                </div>
            </div>
        </div>
    </div>`;

  return res.html(renderTemplate('Admin Dashboard', content, user));
});

// Auth API
app.post('/api/auth/login', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const formData = await req.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return res.status(400).redirect('/admin/login?error=missing-fields');
    }

    const user = store.getUserByEmail(email);
    if (!user || user.password !== password) { // In real app, compare hashed passwords
      return res.status(401).redirect('/admin/login?error=invalid-credentials');
    }

    const session = store.createSession({
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.header('Set-Cookie', `session=${session.token}; HttpOnly; Path=/; Max-Age=604800`);
    return res.redirect('/admin');
  } catch (error) {
    return res.status(500).redirect('/admin/login?error=server-error');
  }
});

app.get('/api/auth/logout', async (req: VerbRequest, res: VerbResponse) => {
  const cookieHeader = req.headers.get('cookie');
  const sessionCookie = cookieHeader?.match(/session=([^;]+)/)?.[1];
  if (sessionCookie) {
    store.deleteSession(sessionCookie);
  }
  
  res.header('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
  return res.redirect('/');
});

// API endpoint for getting posts (for future JS frontend)
app.get('/api/posts', async (req: VerbRequest, res: VerbResponse) => {
  const { 
    status = 'published', 
    page = '1', 
    limit = '10',
    categoryId,
    tag,
    search 
  } = req.query || {};

  const currentPage = parseInt(page.toString());
  const pageLimit = parseInt(limit.toString());

  const { posts, total } = store.getPosts({
    status: status.toString() as any,
    categoryId: categoryId?.toString(),
    tag: tag?.toString(),
    search: search?.toString(),
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit
  });

  const postsWithDetails = posts.map(post => {
    const author = store.getUserById(post.authorId);
    const category = post.categoryId ? store.getCategoryById(post.categoryId) : null;
    const postTags = post.tags.map(tagId => store.getTags().find(t => t.id === tagId)).filter(Boolean);

    return {
      ...post,
      author: author ? { id: author.id, name: author.name } : null,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
      tags: postTags,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString()
    };
  });

  return res.json({
    success: true,
    posts: postsWithDetails,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
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

console.log('🚀 Blog/CMS Server Running');
console.log(`📝 Blog: http://localhost:${port}`);
console.log(`⚙️  Admin: http://localhost:${port}/admin`);
console.log('');
console.log('Demo Admin Login:');
console.log('  Email: admin@blog.com');
console.log('  Password: admin123');
console.log('');
console.log('Features:');
console.log('  ✅ Public blog with SEO-friendly URLs');
console.log('  ✅ Admin panel with dashboard');
console.log('  ✅ Post management (CRUD)');
console.log('  ✅ Category and tag system');
console.log('  ✅ User authentication');
console.log('  ✅ Responsive design');