const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// --- CORS Configuration Update ---

// Define allowed origins to cover common local development ports
const allowedOrigins = [
    // 1. Production/Explicitly set URL (from .env)
    process.env.CLIENT_URL, 
    // 2. Common React/Vite dev ports (5173 is default, 5174 is current fallback)
    'http://localhost:5173',
    'http://localhost:5174', // <-- Added new port 5174
    'http://localhost:5175', // <-- Added common fallback port 5175
    'http://localhost:3000',
    // 3. Alternative loopback addresses often used by development servers
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174', // <-- Added new port 5174
    'http://127.0.0.1:5175', // <-- Added common fallback port 5175
    'http://127.0.0.1:3000',
].filter(Boolean); // Filter out any empty/undefined entries

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      console.log(`CORS Policy blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Anime E-commerce API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      admin: '/api/admin'
    }
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});