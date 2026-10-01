require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const otpRoutes = require('./routes/otpRoutes');
const Sentry = require('@sentry/node'); // 🔥 1. Import Sentry

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const app = express();

// 🔥 2. Initialize Sentry (MUST be before any routes or middleware)
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0, // Captures 100% of transactions for performance monitoring
});

// 🔥 3. The Sentry Request Handler creates a separate execution context
app.use(Sentry.Handlers.requestHandler());

connectDB();

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
    app.use(mongoSanitize());
}

app.use(helmet());

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

const skipRateLimit = (req, res) => process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    skip: skipRateLimit,
    message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: skipRateLimit,
    message: { message: 'Too many login/OTP attempts, please try again after 15 minutes.' }
});

// Routes
app.use('/api/otp', authLimiter, otpRoutes);
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check
app.get('/', (req, res) => {
    res.send("GK's Fitness Shop API is securely live...");
});

// 🔥 4. Sentry Testing Route (Trigger a fake crash to test the dashboard)
app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

// 🔥 5. The Sentry Error Handler (MUST be right before your custom error handler)
app.use(Sentry.Handlers.errorHandler());

// Global Error Handler
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        console.error("🚨 Express Error:", err.message);
    }
    // Sentry has already logged the error by this point, so we just return a safe JSON response to the user
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message,
        sentryEventId: res.sentry // Optionally return the Sentry ID to the user for support tickets
    });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
}

module.exports = app;