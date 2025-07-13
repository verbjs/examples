#!/usr/bin/env bun

import { getDatabase, closeDatabase } from '../db/factory';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    const db = await getDatabase();

    // Create sample users
    const users = await Promise.all([
      db.createUser({
        email: 'alice@example.com',
        name: 'Alice Johnson'
      }),
      db.createUser({
        email: 'bob@example.com',
        name: 'Bob Smith'
      }),
      db.createUser({
        email: 'charlie@example.com',
        name: 'Charlie Brown'
      })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create sample posts
    const posts = await Promise.all([
      db.createPost({
        title: 'Getting Started with Verb Framework',
        content: 'Verb is a powerful multi-protocol framework for building modern applications with Bun. In this post, we\'ll explore the basics of setting up your first Verb application...',
        user_id: users[0].id,
        published: true
      }),
      db.createPost({
        title: 'Database Integration Patterns',
        content: 'Learn how to integrate different databases with your Verb applications. We\'ll cover SQLite, PostgreSQL, and best practices for database design...',
        user_id: users[0].id,
        published: true
      }),
      db.createPost({
        title: 'Building RESTful APIs',
        content: 'This comprehensive guide covers everything you need to know about building robust RESTful APIs with proper error handling, validation, and documentation...',
        user_id: users[1].id,
        published: false
      }),
      db.createPost({
        title: 'Real-time Features with WebSockets',
        content: 'Discover how to add real-time functionality to your applications using WebSockets. We\'ll build a chat system and explore advanced patterns...',
        user_id: users[1].id,
        published: true
      }),
      db.createPost({
        title: 'Performance Optimization Tips',
        content: 'Optimize your Verb applications for maximum performance. Learn about caching strategies, database optimization, and monitoring techniques...',
        user_id: users[2].id,
        published: true
      })
    ]);

    console.log(`✅ Created ${posts.length} posts`);

    // Create sample comments
    const comments = await Promise.all([
      db.createComment({
        content: 'Great introduction! This really helped me understand the basics.',
        post_id: posts[0].id,
        user_id: users[1].id
      }),
      db.createComment({
        content: 'Thanks for sharing. Looking forward to more advanced topics.',
        post_id: posts[0].id,
        user_id: users[2].id
      }),
      db.createComment({
        content: 'The database patterns section is particularly useful. Any plans for MongoDB integration?',
        post_id: posts[1].id,
        user_id: users[2].id
      }),
      db.createComment({
        content: 'Excellent explanation of WebSocket implementation!',
        post_id: posts[3].id,
        user_id: users[0].id
      }),
      db.createComment({
        content: 'The performance tips saved me hours of debugging. Thank you!',
        post_id: posts[4].id,
        user_id: users[1].id
      }),
      db.createComment({
        content: 'Could you add examples for horizontal scaling?',
        post_id: posts[4].id,
        user_id: users[0].id
      })
    ]);

    console.log(`✅ Created ${comments.length} comments`);

    // Show statistics
    const stats = await db.getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`- Users: ${stats.users}`);
    console.log(`- Posts: ${stats.posts}`);
    console.log(`- Published Posts: ${stats.publishedPosts}`);
    console.log(`- Comments: ${stats.comments}`);

    console.log('\n🎉 Database seeding completed successfully!');

    await closeDatabase();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.main) {
  seed();
}