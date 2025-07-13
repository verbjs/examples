import type { User, Product, Category, CartItem, Order, Payment, DiscountCode, Session } from '../types';

export class MemoryStore {
  private users = new Map<string, User>();
  private products = new Map<string, Product>();
  private categories = new Map<string, Category>();
  private cartItems = new Map<string, CartItem[]>();
  private orders = new Map<string, Order>();
  private payments = new Map<string, Payment>();
  private discountCodes = new Map<string, DiscountCode>();
  private sessions = new Map<string, Session>();

  constructor() {
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

  // Products
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  getProducts(filters?: { categoryId?: string; isActive?: boolean; search?: string }): Product[] {
    let products = Array.from(this.products.values());
    
    if (filters?.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters?.isActive !== undefined) {
      products = products.filter(p => p.isActive === filters.isActive);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getProductById(id: string): Product | null {
    return this.products.get(id) || null;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const product = this.products.get(id);
    if (!product) return null;
    
    const updated = { ...product, ...updates, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  // Categories
  createCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getCategoryById(id: string): Category | null {
    return this.categories.get(id) || null;
  }

  // Cart
  addToCart(userId: string, productId: string, quantity: number): CartItem {
    if (!this.cartItems.has(userId)) {
      this.cartItems.set(userId, []);
    }
    
    const userCart = this.cartItems.get(userId)!;
    const existingItem = userCart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      return existingItem;
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        userId,
        productId,
        quantity,
        addedAt: new Date()
      };
      userCart.push(newItem);
      return newItem;
    }
  }

  getCart(userId: string): CartItem[] {
    return this.cartItems.get(userId) || [];
  }

  updateCartItem(userId: string, itemId: string, quantity: number): boolean {
    const userCart = this.cartItems.get(userId) || [];
    const item = userCart.find(i => i.id === itemId);
    
    if (item) {
      if (quantity <= 0) {
        const index = userCart.indexOf(item);
        userCart.splice(index, 1);
      } else {
        item.quantity = quantity;
      }
      return true;
    }
    
    return false;
  }

  removeFromCart(userId: string, itemId: string): boolean {
    const userCart = this.cartItems.get(userId) || [];
    const index = userCart.findIndex(i => i.id === itemId);
    
    if (index > -1) {
      userCart.splice(index, 1);
      return true;
    }
    
    return false;
  }

  clearCart(userId: string): void {
    this.cartItems.set(userId, []);
  }

  // Orders
  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  getOrderById(id: string): Order | null {
    return this.orders.get(id) || null;
  }

  getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateOrderStatus(id: string, status: Order['status']): Order | null {
    const order = this.orders.get(id);
    if (!order) return null;
    
    order.status = status;
    order.updatedAt = new Date();
    return order;
  }

  // Payments
  createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    this.payments.set(newPayment.id, newPayment);
    return newPayment;
  }

  getPaymentById(id: string): Payment | null {
    return this.payments.get(id) || null;
  }

  updatePaymentStatus(id: string, status: Payment['status']): Payment | null {
    const payment = this.payments.get(id);
    if (!payment) return null;
    
    payment.status = status;
    payment.processedAt = new Date();
    return payment;
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

  private seedData(): void {
    // Create categories
    const electronics = this.createCategory({
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      slug: 'electronics'
    });

    const clothing = this.createCategory({
      name: 'Clothing',
      description: 'Fashion and apparel',
      slug: 'clothing'
    });

    const books = this.createCategory({
      name: 'Books',
      description: 'Books and literature',
      slug: 'books'
    });

    // Create admin user
    this.createUser({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    // Create sample products
    this.createProduct({
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 299.99,
      compareAtPrice: 399.99,
      sku: 'WH-001',
      inventory: 50,
      categoryId: electronics.id,
      images: ['/images/headphones.jpg'],
      tags: ['wireless', 'audio', 'bluetooth'],
      isActive: true
    });

    this.createProduct({
      name: 'Cotton T-Shirt',
      description: 'Comfortable 100% cotton t-shirt in various colors',
      price: 24.99,
      sku: 'TS-001',
      inventory: 100,
      categoryId: clothing.id,
      images: ['/images/tshirt.jpg'],
      tags: ['cotton', 'casual', 'basic'],
      isActive: true
    });

    this.createProduct({
      name: 'JavaScript Guide',
      description: 'Complete guide to modern JavaScript development',
      price: 49.99,
      sku: 'BK-001',
      inventory: 25,
      categoryId: books.id,
      images: ['/images/js-book.jpg'],
      tags: ['programming', 'javascript', 'web'],
      isActive: true
    });
  }
}