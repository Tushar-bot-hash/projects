import express from 'express'; // <--- CRITICAL FIX: Express import added
import path from 'path';
import dotenv from 'dotenv';
// import connectDB from './config/db.js'; // <--- Placeholder for your DB connection file/function

// Load environment variables (like PORT and MONGO_URI)
dotenv.config();

// Placeholder: Call your actual database connection function here
// connectDB(); 

// Initialize Express app
const app = express();
// Middleware to parse JSON bodies
app.use(express.json()); 
// ... other middleware (CORS, body parser, etc.) ...

// Your API Routes should be defined here, e.g.:
// app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes);

// --- STATIC FRONTEND SERVING LOGIC (CRITICAL FOR DEPLOYMENT) ---
if (process.env.NODE_ENV === 'production') {
  // 1. Set the static folder to the compiled React build (dist)
  // We use path.resolve because the dist folder is inside 'Frontend-app'
  app.use(express.static(path.resolve('Frontend-app', 'dist')));

  // 2. Serve the index.html file for all non-API requests (the wildcard route)
  app.get('*', (req, res) =>
    res.sendFile(path.resolve('Frontend-app', 'dist', 'index.html'))
  );
} else {
  // If not in production (local development), show the simple JSON status
  app.get('/', (req, res) => {
    // You can remove the old JSON message if you prefer, but it serves as a good health check.
    res.json({ message: "Anime E-commerce API is running!" }); 
  });
}
// --- END STATIC FRONTEND SERVING LOGIC ---

// ... other error handlers ...

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));