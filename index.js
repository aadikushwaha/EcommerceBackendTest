const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const DB_connect = require('./models/dbConnection');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes'); // FIXED: previously pointed to categoryRoutes
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const couponRoutes = require('./routes/couponRoutes');
const { setupWebSocket } = require('./src/socket'); // Adjust if the path is different

// Initialize Express
const app = express();

// Load environment variables
dotenv.config({ path: './utilities/secure.env' });

// Create HTTP server and attach WebSocket
const server = http.createServer(app);
setupWebSocket(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
DB_connect(process.env.DB_name, process.env.DB_url);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes); // FIXED
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/coupons', couponRoutes);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
