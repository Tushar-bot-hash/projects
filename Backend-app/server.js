const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// JWT SECRET CHECK (Best Practice for Authorization)
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. JWT signing will fail.");
    // In a production app, you might crash the process here: process.exit(1);
}

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- START CORS FIX: Allow All Origins ---
// NOTE: Using credentials: true with a dynamic origin function is required
// because the W3C specification forbids origin: '*' when credentials (cookies)
// are being used. This function dynamically reflects the requesting origin.

app.use(cors({ origin: '*', credentials: true })); 
// --- END CORS FIX ---

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
    console.error('Error:', err);
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
    console.log(`⚠️ CORS is configured to allow ALL origins.`);
});