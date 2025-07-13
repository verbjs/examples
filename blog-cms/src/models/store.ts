import type { User, Post, Category, Tag, Comment, Media, Session, BlogSettings } from '../types';

export class BlogStore {
  private users = new Map<string, User>();
  private posts = new Map<string, Post>();
  private categories = new Map<string, Category>();
  private tags = new Map<string, Tag>();
  private comments = new Map<string, Comment>();
  private media = new Map<string, Media>();
  private sessions = new Map<string, Session>();
  private settings: BlogSettings;

  constructor() {
    this.settings = {
      siteName: 'My Blog',
      tagline: 'Just another blog',
      description: 'A blog built with Verb framework',
      siteUrl: 'http://localhost:3000',
      postsPerPage: 10,
      allowComments: true,
      moderateComments: true,
      theme: 'default'
    };
    this.seedData();
  }

  // Users
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  getUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string): User | null {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Categories
  createCategory(category: Omit<Category, 'id' | 'postCount' | 'createdAt'>): Category {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      postCount: 0,
      createdAt: new Date()
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getCategoryBySlug(slug: string): Category | null {
    return Array.from(this.categories.values()).find(c => c.slug === slug) || null;
  }

  getCategoryById(id: string): Category | null {
    return this.categories.get(id) || null;
  }

  // Tags
  createTag(tag: Omit<Tag, 'id' | 'postCount' | 'createdAt'>): Tag {
    const newTag: Tag = {
      ...tag,
      id: crypto.randomUUID(),
      postCount: 0,
      createdAt: new Date()
    };
    this.tags.set(newTag.id, newTag);
    return newTag;
  }

  getOrCreateTag(name: string): Tag {
    const slug = this.slugify(name);
    const existing = Array.from(this.tags.values()).find(t => t.slug === slug);
    if (existing) return existing;
    
    return this.createTag({ name, slug });
  }

  getTags(): Tag[] {
    return Array.from(this.tags.values()).sort((a, b) => b.postCount - a.postCount);
  }

  getTagBySlug(slug: string): Tag | null {
    return Array.from(this.tags.values()).find(t => t.slug === slug) || null;
  }

  // Posts
  createPost(post: Omit<Post, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Post {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(),
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!newPost.slug) {
      newPost.slug = this.generateUniqueSlug(newPost.title);
    }
    
    this.posts.set(newPost.id, newPost);
    this.updateCategoryPostCount(post.categoryId);
    this.updateTagsPostCount(post.tags, 1);
    
    return newPost;
  }

  updatePost(id: string, updates: Partial<Post>): Post | null {
    const post = this.posts.get(id);
    if (!post) return null;

    const oldCategoryId = post.categoryId;
    const oldTags = post.tags;

    const updatedPost = { ...post, ...updates, updatedAt: new Date() };
    this.posts.set(id, updatedPost);

    // Update category counts
    if (oldCategoryId !== updatedPost.categoryId) {
      this.updateCategoryPostCount(oldCategoryId, -1);
      this.updateCategoryPostCount(updatedPost.categoryId);
    }

    // Update tag counts
    if (JSON.stringify(oldTags) !== JSON.stringify(updatedPost.tags)) {
      this.updateTagsPostCount(oldTags, -1);
      this.updateTagsPostCount(updatedPost.tags, 1);
    }

    return updatedPost;
  }

  getPosts(filters?: {
    status?: Post['status'];
    authorId?: string;
    categoryId?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
    includeSticky?: boolean;
  }): { posts: Post[]; total: number } {
    let posts = Array.from(this.posts.values());

    if (filters?.status) {
      posts = posts.filter(p => p.status === filters.status);
    }

    if (filters?.authorId) {
      posts = posts.filter(p => p.authorId === filters.authorId);
    }

    if (filters?.categoryId) {
      posts = posts.filter(p => p.categoryId === filters.categoryId);
    }

    if (filters?.tag) {
      posts = posts.filter(p => p.tags.includes(filters.tag!));
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(search))
      );
    }

    const total = posts.length;

    // Sort by sticky first, then by published date
    posts.sort((a, b) => {
      if (filters?.includeSticky && a.isSticky !== b.isSticky) {
        return b.isSticky ? 1 : -1;
      }
      const aDate = a.publishedAt || a.createdAt;
      const bDate = b.publishedAt || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    if (filters?.limit) {
      const offset = filters.offset || 0;
      posts = posts.slice(offset, offset + filters.limit);
    }

    return { posts, total };
  }

  getPostBySlug(slug: string): Post | null {
    return Array.from(this.posts.values()).find(p => p.slug === slug) || null;
  }

  getPostById(id: string): Post | null {
    return this.posts.get(id) || null;
  }

  incrementPostViews(id: string): void {
    const post = this.posts.get(id);
    if (post) {
      post.viewCount++;
    }
  }

  deletePost(id: string): boolean {
    const post = this.posts.get(id);
    if (!post) return false;

    this.updateCategoryPostCount(post.categoryId, -1);
    this.updateTagsPostCount(post.tags, -1);
    
    return this.posts.delete(id);
  }

  // Media
  createMedia(media: Omit<Media, 'id' | 'createdAt'>): Media {
    const newMedia: Media = {
      ...media,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    this.media.set(newMedia.id, newMedia);
    return newMedia;
  }

  getMedia(): Media[] {
    return Array.from(this.media.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getMediaById(id: string): Media | null {
    return this.media.get(id) || null;
  }

  // Sessions
  createSession(session: Omit<Session, 'id' | 'createdAt'>): Session {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    this.sessions.set(newSession.token, newSession);
    return newSession;
  }

  getSessionByToken(token: string): Session | null {
    const session = this.sessions.get(token);
    return session && session.expiresAt > new Date() ? session : null;
  }

  deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  // Settings
  getSettings(): BlogSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<BlogSettings>): BlogSettings {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }

  // Utilities
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateUniqueSlug(title: string): string {
    let baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (this.getPostBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private updateCategoryPostCount(categoryId?: string, delta: number = 1): void {
    if (!categoryId) return;
    const category = this.categories.get(categoryId);
    if (category) {
      category.postCount = Math.max(0, category.postCount + delta);
    }
  }

  private updateTagsPostCount(tagIds: string[], delta: number): void {
    for (const tagId of tagIds) {
      const tag = this.tags.get(tagId);
      if (tag) {
        tag.postCount = Math.max(0, tag.postCount + delta);
      }
    }
  }

  private seedData(): void {
    // Create admin user
    const admin = this.createUser({
      email: 'admin@blog.com',
      password: 'admin123', // In real app, this should be hashed
      name: 'Admin User',
      role: 'admin',
      isActive: true
    });

    // Create categories
    const techCategory = this.createCategory({
      name: 'Technology',
      slug: 'technology',
      description: 'Posts about technology and programming'
    });

    const lifestyleCategory = this.createCategory({
      name: 'Lifestyle',
      slug: 'lifestyle',
      description: 'Posts about lifestyle and personal experiences'
    });

    // Create tags
    const jsTag = this.createTag({ name: 'JavaScript', slug: 'javascript' });
    const webdevTag = this.createTag({ name: 'Web Development', slug: 'web-development' });
    const travelTag = this.createTag({ name: 'Travel', slug: 'travel' });

    // Create sample posts
    this.createPost({
      title: 'Getting Started with Modern JavaScript',
      slug: 'getting-started-modern-javascript',
      content: `<p>JavaScript has evolved significantly over the years. In this post, we'll explore modern JavaScript features that every developer should know.</p>

<h2>ES6+ Features</h2>
<p>Modern JavaScript includes many powerful features like arrow functions, destructuring, and async/await that make code more readable and maintainable.</p>

<h3>Arrow Functions</h3>
<pre><code>const greet = name => \`Hello, \${name}!\`;</code></pre>

<h3>Destructuring</h3>
<pre><code>const { name, age } = user;</code></pre>

<p>These features help write cleaner, more expressive code that's easier to understand and maintain.</p>`,
      excerpt: 'Explore modern JavaScript features that every developer should know, including ES6+ syntax and best practices.',
      authorId: admin.id,
      categoryId: techCategory.id,
      tags: [jsTag.id, webdevTag.id],
      status: 'published',
      isSticky: true,
      allowComments: true,
      metaTitle: 'Modern JavaScript Guide - Essential Features for Developers',
      metaDescription: 'Learn modern JavaScript features including ES6+ syntax, arrow functions, destructuring, and async/await for better code.',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    this.createPost({
      title: 'Building Better Web Applications',
      slug: 'building-better-web-applications',
      content: `<p>Creating high-quality web applications requires attention to performance, accessibility, and user experience.</p>

<h2>Performance Best Practices</h2>
<ul>
<li>Optimize images and assets</li>
<li>Minimize HTTP requests</li>
<li>Use efficient algorithms</li>
<li>Implement caching strategies</li>
</ul>

<h2>Accessibility Matters</h2>
<p>Making your applications accessible ensures they work for everyone, regardless of their abilities or the technology they use.</p>`,
      excerpt: 'Learn how to build high-quality web applications with focus on performance, accessibility, and user experience.',
      authorId: admin.id,
      categoryId: techCategory.id,
      tags: [webdevTag.id],
      status: 'published',
      isSticky: false,
      allowComments: true,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    });

    this.createPost({
      title: 'Work-Life Balance in Tech',
      slug: 'work-life-balance-tech',
      content: `<p>Maintaining a healthy work-life balance is crucial for long-term success and happiness in the tech industry.</p>

<h2>Setting Boundaries</h2>
<p>It's important to set clear boundaries between work and personal time, especially when working remotely.</p>

<h2>Taking Breaks</h2>
<p>Regular breaks and time off help prevent burnout and maintain creativity and productivity.</p>`,
      excerpt: 'Tips for maintaining a healthy work-life balance while working in the tech industry.',
      authorId: admin.id,
      categoryId: lifestyleCategory.id,
      tags: [travelTag.id],
      status: 'published',
      isSticky: false,
      allowComments: true,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    });

    // Update post counts
    techCategory.postCount = 2;
    lifestyleCategory.postCount = 1;
    jsTag.postCount = 1;
    webdevTag.postCount = 2;
    travelTag.postCount = 1;
  }
}