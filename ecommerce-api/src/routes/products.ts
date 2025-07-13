import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import type { MemoryStore } from '../models/store';
import { createAuthMiddleware, createAdminMiddleware, type AuthenticatedRequest } from '../middleware/auth';

export const createProductRoutes = (store: MemoryStore) => {
  const app = createServer();
  const authMiddleware = createAuthMiddleware(store);
  const adminMiddleware = createAdminMiddleware();

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
          // Remove sensitive fields
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

  app.post('/api/products', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const {
        name,
        description,
        price,
        compareAtPrice,
        sku,
        inventory,
        categoryId,
        images = [],
        tags = [],
        weight,
        dimensions
      } = await req.json();

      if (!name || !description || !price || !sku || !categoryId) {
        return res.status(400).json({ error: 'Name, description, price, SKU, and category are required' });
      }

      if (price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }

      if (inventory < 0) {
        return res.status(400).json({ error: 'Inventory cannot be negative' });
      }

      const category = store.getCategoryById(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      const product = store.createProduct({
        name,
        description,
        price,
        compareAtPrice,
        sku,
        inventory,
        categoryId,
        images,
        tags,
        weight,
        dimensions,
        isActive: true
      });

      return res.status(201).json({
        success: true,
        product: {
          ...product,
          category: { id: category.id, name: category.name },
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString()
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const existingProduct = store.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updates = await req.json();
      
      // Validate updates
      if (updates.price !== undefined && updates.price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }

      if (updates.inventory !== undefined && updates.inventory < 0) {
        return res.status(400).json({ error: 'Inventory cannot be negative' });
      }

      if (updates.categoryId) {
        const category = store.getCategoryById(updates.categoryId);
        if (!category) {
          return res.status(400).json({ error: 'Invalid category ID' });
        }
      }

      const updatedProduct = store.updateProduct(id, updates);
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const category = store.getCategoryById(updatedProduct.categoryId);

      return res.json({
        success: true,
        product: {
          ...updatedProduct,
          category: category ? { id: category.id, name: category.name } : null,
          createdAt: updatedProduct.createdAt.toISOString(),
          updatedAt: updatedProduct.updatedAt.toISOString()
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Soft delete by setting isActive to false
      const updatedProduct = store.updateProduct(id, { isActive: false });
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
};