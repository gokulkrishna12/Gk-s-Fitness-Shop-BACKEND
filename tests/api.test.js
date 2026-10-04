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
});

// Cleanup: Disconnect from MongoDB Atlas so the test script finishes cleanly
afterAll(async () => {
    await mongoose.connection.close();
});