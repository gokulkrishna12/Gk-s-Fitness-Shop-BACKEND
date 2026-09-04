require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const otpRoutes = require('./routes/otpRoutes');

const app = express();

// Connect DB
connectDB();

// Middleware
const corsOptions = {
    // This allows localhost for your laptop, but uses the live URL in production!
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/otp', otpRoutes);

// Swagger Docs UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check
app.get('/', (req, res) => {
    res.send("GK's Fitness Shop API is live...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});