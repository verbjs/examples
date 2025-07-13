# E-commerce API Example

A complete e-commerce API demonstrating product management, shopping cart, order processing, and payment integration with Verb.

## Features

- ✅ Product catalog with categories and inventory
- ✅ Shopping cart management
- ✅ User authentication and profiles
- ✅ Order processing and tracking
- ✅ Payment integration (Stripe simulation)
- ✅ Inventory management
- ✅ Discount codes and promotions
- ✅ Admin dashboard endpoints

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List products with pagination
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id` - Get payment status

## Quick Start

```bash
bun install
bun run dev
```

API will be available at http://localhost:3000