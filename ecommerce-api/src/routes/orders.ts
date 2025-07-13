import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import type { MemoryStore } from '../models/store';
import type { OrderItem, Address } from '../types';
import { createAuthMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { PaymentService } from '../services/payment';

export const createOrderRoutes = (store: MemoryStore, paymentService: PaymentService) => {
  const app = createServer();
  const authMiddleware = createAuthMiddleware(store);

  app.get('/api/orders', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const orders = store.getUserOrders(req.user.id);
      
      const ordersWithDetails = orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      }));

      return res.json({
        success: true,
        orders: ordersWithDetails
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/orders/:id', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = store.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({
        success: true,
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString()
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/orders', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const { shippingAddress, billingAddress, paymentMethodId } = await req.json();

      if (!shippingAddress || !paymentMethodId) {
        return res.status(400).json({ error: 'Shipping address and payment method are required' });
      }

      // Validate address
      if (!shippingAddress.firstName || !shippingAddress.lastName || 
          !shippingAddress.address1 || !shippingAddress.city || 
          !shippingAddress.state || !shippingAddress.zipCode || 
          !shippingAddress.country) {
        return res.status(400).json({ error: 'Complete shipping address is required' });
      }

      // Get user's cart
      const cartItems = store.getCart(req.user.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate order totals
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const cartItem of cartItems) {
        const product = store.getProductById(cartItem.productId);
        if (!product || !product.isActive) {
          return res.status(400).json({ 
            error: `Product not found or unavailable: ${cartItem.productId}`
          });
        }

        if (product.inventory < cartItem.quantity) {
          return res.status(400).json({ 
            error: `Insufficient inventory for ${product.name}. Available: ${product.inventory}, Requested: ${cartItem.quantity}`
          });
        }

        const itemTotal = product.price * cartItem.quantity;
        subtotal += itemTotal;

        orderItems.push({
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: cartItem.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal
        });
      }

      // Calculate taxes and shipping
      const taxRate = 0.08; // 8% tax
      const taxAmount = subtotal * taxRate;
      const shippingAmount = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(
        totalAmount,
        'usd',
        { orderId: 'pending', userId: req.user.id }
      );

      // Create order
      const order = store.createOrder({
        userId: req.user.id,
        items: orderItems,
        status: 'pending',
        totalAmount,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount: 0,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod: paymentMethodId,
        paymentId: paymentIntent.id
      });

      // Update payment intent metadata
      paymentIntent.metadata!.orderId = order.id;

      // Update inventory (reserve items)
      for (const cartItem of cartItems) {
        const product = store.getProductById(cartItem.productId);
        if (product) {
          store.updateProduct(product.id, { 
            inventory: product.inventory - cartItem.quantity 
          });
        }
      }

      // Clear cart
      store.clearCart(req.user.id);

      return res.status(201).json({
        success: true,
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString()
        },
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/orders/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = store.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (order.status === 'shipped' || order.status === 'delivered') {
        return res.status(400).json({ error: 'Cannot cancel shipped or delivered orders' });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({ error: 'Order is already cancelled' });
      }

      // Cancel payment if exists
      if (order.paymentId) {
        await paymentService.cancelPaymentIntent(order.paymentId);
      }

      // Restore inventory
      for (const item of order.items) {
        const product = store.getProductById(item.productId);
        if (product) {
          store.updateProduct(product.id, { 
            inventory: product.inventory + item.quantity 
          });
        }
      }

      // Update order status
      const updatedOrder = store.updateOrderStatus(id, 'cancelled');

      return res.json({
        success: true,
        order: {
          ...updatedOrder,
          createdAt: updatedOrder!.createdAt.toISOString(),
          updatedAt: updatedOrder!.updatedAt.toISOString()
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch('/api/orders/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const { id } = req.params || {};
      const { status } = await req.json();

      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updatedOrder = store.updateOrderStatus(id, status);
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({
        success: true,
        order: {
          ...updatedOrder,
          createdAt: updatedOrder.createdAt.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString()
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to update order status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
};