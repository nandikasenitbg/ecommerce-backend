# 🛒 E-Commerce Backend API

A production-ready RESTful API for a modern e-commerce application built with Node.js, Express, and MongoDB.

---

## 📁 Project Structure

```
ecommerce-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── userController.js      # Auth + user management
│   ├── productController.js   # Products + reviews
│   ├── cartController.js      # Shopping cart
│   ├── orderController.js     # Orders
│   └── paymentController.js   # Stripe-ready payment
├── middleware/
│   ├── authMiddleware.js      # JWT protect + admin guard
│   ├── asyncHandler.js        # Async error wrapper
│   └── errorMiddleware.js     # Global error handler
├── models/
│   ├── User.js
│   ├── Product.js             # Includes reviews sub-schema
│   ├── Cart.js
│   └── Order.js
├── routes/
│   ├── userRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   └── paymentRoutes.js
├── seeder/
│   ├── data.js                # Sample users + products
│   └── seed.js                # Import/destroy script
├── utils/
│   ├── generateToken.js       # JWT generation
│   ├── apiResponse.js         # Standardized responses
│   └── calcPrices.js          # Order price calculator
├── .env.example
├── .gitignore
├── package.json
└── server.js                  # Entry point
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ecommerce-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 3 users (1 admin + 2 regular users)
- 12 sample products across all categories

To wipe all data:
```bash
npm run seed:destroy
```

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

## 🔑 Seeded Credentials

| Role  | Email                  | Password     |
|-------|------------------------|--------------|
| Admin | admin@ecommerce.com    | admin123     |
| User  | jane@example.com       | password123  |
| User  | john@example.com       | password123  |

---

## 📡 API Reference

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### 👤 Users & Auth

| Method | Endpoint              | Access  | Description           |
|--------|-----------------------|---------|-----------------------|
| POST   | /api/users/register   | Public  | Register new account  |
| POST   | /api/users/login      | Public  | Login, returns JWT    |
| GET    | /api/users/profile    | Private | Get own profile       |
| PUT    | /api/users/profile    | Private | Update own profile    |
| GET    | /api/users            | Admin   | List all users        |
| GET    | /api/users/:id        | Admin   | Get user by ID        |
| PUT    | /api/users/:id        | Admin   | Update user           |
| DELETE | /api/users/:id        | Admin   | Delete user           |

**Register:**
```json
POST /api/users/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

**Login:**
```json
POST /api/users/login
{
  "email": "jane@example.com",
  "password": "password123"
}
```
Response includes `token` — use as `Authorization: Bearer <token>` header for protected routes.

---

### 🛍️ Products

| Method | Endpoint                          | Access  | Description                     |
|--------|-----------------------------------|---------|---------------------------------|
| GET    | /api/products                     | Public  | List products (search/filter)   |
| GET    | /api/products/featured            | Public  | Featured products               |
| GET    | /api/products/top-rated           | Public  | Highest-rated products          |
| GET    | /api/products/categories          | Public  | All distinct categories         |
| GET    | /api/products/:id                 | Public  | Get single product              |
| POST   | /api/products                     | Admin   | Create product                  |
| PUT    | /api/products/:id                 | Admin   | Update product                  |
| DELETE | /api/products/:id                 | Admin   | Delete product                  |
| POST   | /api/products/:id/reviews         | Private | Add review                      |
| DELETE | /api/products/:id/reviews/:rId    | Private | Delete review                   |

**Query Parameters for GET /api/products:**

| Param      | Type   | Example                      | Description              |
|------------|--------|------------------------------|--------------------------|
| keyword    | string | `?keyword=apple`             | Full-text search         |
| category   | string | `?category=Electronics`      | Filter by category       |
| brand      | string | `?brand=Sony`                | Filter by brand          |
| minPrice   | number | `?minPrice=50`               | Minimum price            |
| maxPrice   | number | `?maxPrice=500`              | Maximum price            |
| minRating  | number | `?minRating=4`               | Minimum rating           |
| inStock    | bool   | `?inStock=true`              | Show in-stock only       |
| featured   | bool   | `?featured=true`             | Featured only            |
| sort       | string | `?sort=price-asc`            | Sort order               |
| page       | number | `?page=2`                    | Page number              |
| limit      | number | `?limit=12`                  | Items per page           |

Sort options: `price-asc`, `price-desc`, `rating-desc`, `newest`, `oldest`

**Create Product (Admin):**
```json
POST /api/products
Authorization: Bearer <admin_token>
{
  "name": "Product Name",
  "description": "Full product description",
  "price": 299.99,
  "images": [{ "url": "https://...", "alt": "Product image" }],
  "category": "Electronics",
  "brand": "BrandName",
  "countInStock": 50,
  "isFeatured": true,
  "discount": 10
}
```

**Add Review:**
```json
POST /api/products/:id/reviews
Authorization: Bearer <token>
{
  "rating": 5,
  "comment": "Excellent product, highly recommended!"
}
```

---

### 🛒 Cart

| Method | Endpoint          | Access  | Description           |
|--------|-------------------|---------|-----------------------|
| GET    | /api/cart         | Private | Get user's cart       |
| POST   | /api/cart         | Private | Add item to cart      |
| PUT    | /api/cart/:itemId | Private | Update item quantity  |
| DELETE | /api/cart/:itemId | Private | Remove item from cart |
| DELETE | /api/cart         | Private | Clear entire cart     |

**Add to Cart:**
```json
POST /api/cart
Authorization: Bearer <token>
{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "quantity": 2
}
```

**Update Quantity:**
```json
PUT /api/cart/:itemId
Authorization: Bearer <token>
{
  "quantity": 3
}
```

---

### 📦 Orders

| Method | Endpoint                   | Access  | Description              |
|--------|----------------------------|---------|--------------------------|
| POST   | /api/orders                | Private | Create order             |
| GET    | /api/orders/my-orders      | Private | Get own orders           |
| GET    | /api/orders/:id            | Private | Get order by ID          |
| PUT    | /api/orders/:id/pay        | Private | Mark order as paid       |
| GET    | /api/orders                | Admin   | Get all orders + stats   |
| PUT    | /api/orders/:id/deliver    | Admin   | Mark as delivered        |
| PUT    | /api/orders/:id/status     | Admin   | Update order status      |

**Create Order:**
```json
POST /api/orders
Authorization: Bearer <token>
{
  "orderItems": [
    {
      "product": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Sony Headphones",
      "image": "https://...",
      "price": 349.99,
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "Jane Doe",
    "address": "123 Main Street",
    "city": "New York",
    "postalCode": "10001",
    "country": "United States"
  },
  "paymentMethod": "stripe"
}
```

**Update Order Status (Admin):**
```json
PUT /api/orders/:id/status
Authorization: Bearer <admin_token>
{
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456784",
  "notes": "Dispatched via FedEx"
}
```

Status values: `pending` → `processing` → `shipped` → `delivered` | `cancelled`

---

### 💳 Payment

| Method | Endpoint                              | Access  | Description                    |
|--------|---------------------------------------|---------|--------------------------------|
| GET    | /api/payment/config                   | Public  | Get Stripe publishable key     |
| POST   | /api/payment/create-payment-intent    | Private | Create Stripe PaymentIntent    |
| POST   | /api/payment/confirm                  | Private | Confirm payment + update order |
| POST   | /api/payment/webhook                  | Public  | Stripe webhook handler         |

**Create Payment Intent:**
```json
POST /api/payment/create-payment-intent
Authorization: Bearer <token>
{
  "orderId": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

## 🔐 Authentication

All protected routes require a JWT token in the request header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire based on `JWT_EXPIRES_IN` in your `.env` (default: 30 days).

---

## 🌐 Connecting from React Frontend

### With Axios

```javascript
// src/api/axiosConfig.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically attach JWT token from localStorage
API.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo?.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
});

export default API;
```

```javascript
// Example usage
import API from './api/axiosConfig';

// Login
const { data } = await API.post('/users/login', { email, password });
localStorage.setItem('userInfo', JSON.stringify(data.data));

// Get products
const { data } = await API.get('/products?keyword=sony&page=1');

// Add to cart
const { data } = await API.post('/cart', { productId, quantity: 1 });

// Create order
const { data } = await API.post('/orders', { orderItems, shippingAddress, paymentMethod });
```

### With Fetch API

```javascript
const BASE_URL = 'http://localhost:5000/api';
const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

const response = await fetch(`${BASE_URL}/products`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
const data = await response.json();
```

---

## 💳 Activating Stripe Payments

1. Sign up at [stripe.com](https://stripe.com) and get your API keys
2. Add keys to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Uncomment the Stripe code blocks in `controllers/paymentController.js`
4. Install Stripe CLI for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:5000/api/payment/webhook
   ```

---

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Use a strong, random `JWT_SECRET` (min 32 chars)
- [ ] Point `MONGO_URI` to MongoDB Atlas
- [ ] Set `CLIENT_URL` to your deployed frontend domain
- [ ] Enable HTTPS (use a reverse proxy like Nginx)
- [ ] Add rate limiting (e.g., `express-rate-limit`)
- [ ] Set up MongoDB indexes (auto-created from schema)
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard

---

## 📦 Tech Stack

| Technology     | Purpose                        |
|----------------|-------------------------------|
| Node.js        | JavaScript runtime             |
| Express.js     | Web framework                  |
| MongoDB        | NoSQL database                 |
| Mongoose       | MongoDB ODM                    |
| JWT            | Authentication tokens          |
| bcryptjs       | Password hashing               |
| cors           | Cross-origin resource sharing  |
| morgan         | HTTP request logging           |
| dotenv         | Environment variable management|
| Stripe         | Payment processing (prepared)  |
