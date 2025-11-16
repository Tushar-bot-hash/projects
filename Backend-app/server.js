const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// JWT SECRET CHECK
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
}

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// List of allowed origins
const allowedOrigins = [
    'https://projects-l2cf7s8oi-tusharv811-2882s-projects.vercel.app',
    'https://projects-lemon-eight.vercel.app/', 
    'https://anime-api-backend-u42d.onrender.com', 
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000'
];

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`Allowing origin: ${origin}`);
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Manual CORS headers as fallback
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Anime E-commerce API is running!',
        version: '1.0.0',
        cors: 'Enabled',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/cors-test', (req, res) => {
    res.json({
        message: 'CORS is working!',
        allowedOrigins: allowedOrigins,
        requestOrigin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/payment', require('./src/routes/payment'));
app.use('/api/reviews', require('./src/routes/review'));

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// 404 handler
app.use((req, res) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`✅ CORS is configured for the following origins:`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
});