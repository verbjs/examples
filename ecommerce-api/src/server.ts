import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import { MemoryStore } from './models/store';
import { PaymentService } from './services/payment';
import { createAuthRoutes } from './routes/auth';
import { createProductRoutes } from './routes/products';
import { createOrderRoutes } from './routes/orders';
import { createAuthMiddleware, type AuthenticatedRequest } from './middleware/auth';

const store = new MemoryStore();
const paymentService = new PaymentService();
const authMiddleware = createAuthMiddleware(store);

const app = createServer();

// CORS middleware
app.use('*', async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }
  
  next();
});

// Import route factories (not used but keeping for reference)
// import { createAuthRoutes } from './routes/auth';
// import { createProductRoutes } from './routes/products'; 
// import { createOrderRoutes } from './routes/orders';

// Auth routes
app.post('/api/auth/register', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = store.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = store.createUser({
      email,
      password, // In real app, this should be hashed
      firstName,
      lastName,
      role: 'customer'
    });

    const token = crypto.randomUUID();
    const session = store.createSession({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token: session.token
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/auth/login', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = store.getUserByEmail(email);
    if (!user || user.password !== password) { // In real app, verify hashed password
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = crypto.randomUUID();
    const session = store.createSession({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token: session.token
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/auth/profile', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

// Product routes
app.get('/api/products', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { 
      categoryId, 
      search, 
      page = '1', 
      limit = '12',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query || {};

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const offset = (pageNum - 1) * limitNum;

    const filters: any = { isActive: true };
    if (categoryId) filters.categoryId = categoryId.toString();
    if (search) filters.search = search.toString();

    let products = store.getProducts(filters);

    // Sort products
    if (sortBy === 'price') {
      products.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
    } else if (sortBy === 'name') {
      products.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    }

    const total = products.length;
    const paginatedProducts = products.slice(offset, offset + limitNum);

    // Add category information
    const productsWithCategory = paginatedProducts.map(product => {
      const category = store.getCategoryById(product.categoryId);
      return {
        ...product,
        category: category ? { id: category.id, name: category.name } : null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      };
    });

    return res.json({
      success: true,
      products: productsWithCategory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: offset + limitNum < total,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/products/:id', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params || {};
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = store.getProductById(id);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const category = store.getCategoryById(product.categoryId);

    return res.json({
      success: true,
      product: {
        ...product,
        category: category ? { id: category.id, name: category.name } : null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Categories endpoints
app.get('/api/categories', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const categories = store.getCategories();
    return res.json({
      success: true,
      categories
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/categories', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, slug, parentId } = await req.json();

    if (!name || !description || !slug) {
      return res.status(400).json({ error: 'Name, description, and slug are required' });
    }

    const category = store.createCategory({
      name,
      description,
      slug,
      parentId
    });

    return res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart endpoints
app.get('/api/cart', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const cartItems = store.getCart(req.user.id);
    let totalAmount = 0;

    const cartWithProducts = cartItems.map(item => {
      const product = store.getProductById(item.productId);
      const itemTotal = product ? product.price * item.quantity : 0;
      totalAmount += itemTotal;

      return {
        ...item,
        product: product ? {
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          inventory: product.inventory
        } : null,
        itemTotal,
        addedAt: item.addedAt.toISOString()
      };
    });

    return res.json({
      success: true,
      cart: {
        items: cartWithProducts,
        totalAmount,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch cart',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/cart/items', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const product = store.getProductById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.inventory < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient inventory',
        available: product.inventory
      });
    }

    const cartItem = store.addToCart(req.user.id, productId, quantity);

    return res.status(201).json({
      success: true,
      cartItem: {
        ...cartItem,
        addedAt: cartItem.addedAt.toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to add item to cart',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/cart/items/:id', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const { id } = req.params || {};
    const { quantity } = await req.json();

    if (!id) {
      return res.status(400).json({ error: 'Cart item ID is required' });
    }

    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const success = store.updateCartItem(req.user.id, id, quantity);
    if (!success) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    return res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to update cart item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/cart/items/:id', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const { id } = req.params || {};

    if (!id) {
      return res.status(400).json({ error: 'Cart item ID is required' });
    }

    const success = store.removeFromCart(req.user.id, id);
    if (!success) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    return res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to remove cart item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment endpoints
app.post('/api/payments/create-intent', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const { amount, currency = 'usd' } = await req.json();

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = await paymentService.createPaymentIntent(
      amount,
      currency,
      { userId: req.user.id }
    );

    return res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/payments/confirm', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const { paymentIntentId, paymentMethodId } = await req.json();

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ error: 'Payment intent ID and payment method ID are required' });
    }

    const result = await paymentService.confirmPayment(paymentIntentId, paymentMethodId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Payment failed',
        details: result.error
      });
    }

    // Update order status if payment succeeded
    if (result.paymentIntent?.metadata?.orderId) {
      store.updateOrderStatus(result.paymentIntent.metadata.orderId, 'confirmed');
    }

    return res.json({
      success: true,
      paymentIntent: result.paymentIntent
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/payments/:id', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    const { id } = req.params || {};

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const paymentIntent = await paymentService.retrievePaymentIntent(id);
    if (!paymentIntent) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json({
      success: true,
      paymentIntent
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin dashboard endpoint
app.get('/api/admin/dashboard', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get dashboard stats
    const products = store.getProducts();
    const activeProducts = products.filter(p => p.isActive);
    const categories = store.getCategories();
    
    // This would typically come from a proper analytics store
    const stats = {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      totalCategories: categories.length,
      lowStockProducts: activeProducts.filter(p => p.inventory <= 5).length
    };

    return res.json({
      success: true,
      stats,
      lowStockProducts: activeProducts
        .filter(p => p.inventory <= 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          inventory: p.inventory
        }))
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API documentation endpoint
app.get('/api', async (req: VerbRequest, res: VerbResponse) => {
  return res.json({
    name: 'E-commerce API',
    version: '1.0.0',
    description: 'Complete e-commerce API with authentication, product management, and payments',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET /api/auth/profile'
      ],
      products: [
        'GET /api/products',
        'GET /api/products/:id',
        'POST /api/products (admin)',
        'PUT /api/products/:id (admin)',
        'DELETE /api/products/:id (admin)'
      ],
      categories: [
        'GET /api/categories',
        'POST /api/categories (admin)'
      ],
      cart: [
        'GET /api/cart',
        'POST /api/cart/items',
        'PUT /api/cart/items/:id',
        'DELETE /api/cart/items/:id'
      ],
      orders: [
        'GET /api/orders',
        'GET /api/orders/:id',
        'POST /api/orders',
        'POST /api/orders/:id/cancel'
      ],
      payments: [
        'POST /api/payments/create-intent',
        'POST /api/payments/confirm',
        'GET /api/payments/:id'
      ]
    }
  });
});

// Health check
app.get('/health', async (req: VerbRequest, res: VerbResponse) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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

console.log('🚀 E-commerce API Server Running');
console.log(`🛍️  Access at: http://localhost:${port}`);
console.log('');
console.log('Available Endpoints:');
console.log('  GET  /api                    - API documentation');
console.log('  GET  /health                 - Health check');
console.log('  POST /api/auth/register      - User registration');
console.log('  POST /api/auth/login         - User login');
console.log('  GET  /api/products           - List products');
console.log('  GET  /api/categories         - List categories');
console.log('  GET  /api/cart               - Get user cart');
console.log('  POST /api/orders             - Create order');
console.log('  POST /api/payments/create-intent - Create payment');
console.log('');
console.log('Test Credentials:');
console.log('  Admin: admin@example.com / admin123');