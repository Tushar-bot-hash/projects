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

// =========================================================================
// 🚀 CORS FIX: Dynamic Origin Reflection 
// This resolves the "credentials with wildcard" error by allowing your 
// specific Vercel domain to communicate with your Render backend.

const allowedOrigins = [
    // 🛑 YOUR VERCEL FRONTEND DOMAIN
    'https://projects-eight-gules.vercel.app', 
    
    // Your Render Backend Domain (sometimes needed for direct access/testing)
    'https://anime-api-backend-u42d.onrender.com', 

    'http://localhost:3000',                 // Common React local development
    'http://localhost:5173',                 // Common Vue/Vite local development
    // Add any other local ports you use, if necessary
]; 

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps) 
        // AND allow all listed origins.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS block: Request from unauthorized origin: ${origin}`);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true // ESSENTIAL for sending cookies/authorization tokens
}));
// --- END CORS FIX ---
// =========================================================================

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
            admin: '/api/admin',
            payment: '/api/payment' // 🆕 Added payment endpoint
        }
    });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/payment', require('./src/routes/payment')); // 🆕 ADDED PAYMENT ROUTE

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
    console.log(`✅ CORS is configured for specific origins.`);
    console.log(`✅ Payment routes are now available at /api/payment`); // 🆕 Added confirmation
});