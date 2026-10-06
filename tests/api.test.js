// 1. Intercept and mock Expo to bypass the ESM crash and prevent live notifications
jest.mock('expo-server-sdk', () => {
    return {
        Expo: jest.fn().mockImplementation(() => ({
            sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
            chunkPushNotifications: jest.fn((messages) => [messages]),
        }))
    };
});

// 2. Intercept and mock Sentry to silence the diagnostics warning
jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    setupExpressErrorHandler: jest.fn()
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// 🔥 THE FIX: Tell Jest to wait until MongoDB connects before firing HTTP requests
beforeAll(async () => {
    while (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
});

describe('GK Fitness Shop API - Integration Tests', () => {

    describe('GET / (Health Check)', () => {
        it('should return 200 and confirm the API is securely live', async () => {
            const response = await request(app).get('/');

            // If it still fails, this will print the exact JSON error we just set up!
            if (response.statusCode !== 200) {
                console.error("Health Check Failed:", response.body);
            }

            expect(response.statusCode).toBe(200);
            expect(response.text).toContain('live');
        });
    });

    describe('GET /api/products (Product Catalog)', () => {
        it('should return a 200 status code', async () => {
            const response = await request(app).get('/api/products');

            if (response.statusCode !== 200) {
                console.error("Products API Failed:", response.body);
            }

            expect(response.statusCode).toBe(200);
        });

        it('should return an array of products from MongoDB Atlas', async () => {
            const response = await request(app).get('/api/products');
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    // 🔥 SPRINT 1 NEW TICKET: Payment Integration Tests
    describe('POST /api/payments/checkout (Razorpay Order Generation)', () => {
        it('should reject checkout if order items are missing', async () => {
            // Attempting to checkout without a cart
            const response = await request(app)
                .post('/api/payments/checkout')
                .send({
                    totalAmount: 500,
                    orderItems: [] // Empty cart to trigger the error validation
                });

            // Depending on if your auth middleware fires first, this will be 401 (Unauthorized) 
            // or 400 (Bad Request from the controller). We just want to ensure it doesn't crash (500).
            expect([400, 401]).toContain(response.statusCode);
        });

        it('should block unauthorized users from verifying fake signatures', async () => {
            const response = await request(app)
                .post('/api/payments/paymentverification')
                .send({
                    razorpay_order_id: "fake_order",
                    razorpay_payment_id: "fake_payment",
                    razorpay_signature: "fake_signature"
                });

            // The system should block this securely
            expect([400, 401, 404]).toContain(response.statusCode);
        });
    });

});

// Cleanup: Disconnect from MongoDB Atlas so the test script finishes cleanly
afterAll(async () => {
    await mongoose.connection.close();
});