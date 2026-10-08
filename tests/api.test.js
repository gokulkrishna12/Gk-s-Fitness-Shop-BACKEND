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
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');

// 🔥 FIX: Tell Jest to wait up to 60 seconds because Jenkins takes time to download the Memory DB binary
jest.setTimeout(60000);

let mongoServer;

// 🔥 Added 60000ms timeout parameter to the hook
beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}, 60000);

describe('GK Fitness Shop API - Integration Tests', () => {

    describe('GET / (Health Check)', () => {
        it('should return 200 and confirm the API is securely live', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.text).toContain('live');
        });
    });

    describe('GET /api/products (Product Catalog)', () => {
        it('should return a 200 status code', async () => {
            const response = await request(app).get('/api/products');
            expect(response.statusCode).toBe(200);
        });

        it('should return an array of products from MongoDB Atlas', async () => {
            const response = await request(app).get('/api/products');
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    describe('POST /api/payment/create-order (Razorpay Order Generation)', () => {
        it('should block unauthorized or empty checkouts', async () => {
            const response = await request(app)
                .post('/api/payment/create-order')
                .send({
                    totalAmount: 500,
                    orderItems: [] 
                });
            expect([400, 401]).toContain(response.statusCode);
        });

        it('should block unauthorized users from verifying fake signatures', async () => {
            const response = await request(app)
                .post('/api/payment/verify-payment')
                .send({
                    razorpay_order_id: "fake_order",
                    razorpay_payment_id: "fake_payment",
                    razorpay_signature: "fake_signature"
                });
            expect([400, 401, 404]).toContain(response.statusCode);
        });
    });

});

// 🔥 Added 60000ms timeout parameter to the hook
afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
}, 60000);