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

// =========================================================================
// 🚀 SIMPLE & EFFECTIVE CORS CONFIGURATION
// =========================================================================

const allowedOrigins = [
    'https://projects-l2cf7s8oi-tusharv811-2882s-projects.vercel.app',
    'https://projects-eight-gules.vercel.app', 
    'https://anime-api-backend-u42d.onrender.com', 
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000'
]; 

// Apply CORS middleware with simple configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// =========================================================================
// 🛠️ MANUAL PREFLIGHT HANDLER (NO WILDCARD ROUTES)
// =========================================================================

// Instead of app.options('*'), we'll handle preflight manually for specific routes
// OR use this approach - manually set headers for OPTIONS requests

// Global preflight handler - using a different approach
app.use((req, res, next) => {
    // Handle OPTIONS method (preflight requests)
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).send();
    }
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route with CORS info
app.get('/', (req, res) => {
    res.json({ 
        message: 'Anime E-commerce API is running!',
        version: '1.0.0',
        cors: {
            enabled: true,
            allowedOrigins: allowedOrigins
        },
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders',
            admin: '/api/admin',
            payment: '/api/payment'
        }
    });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/payment', require('./src/routes/payment'));

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
    console.log(`✅ CORS is configured for:`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    console.log(`✅ Payment routes are available at /api/payment`);
});