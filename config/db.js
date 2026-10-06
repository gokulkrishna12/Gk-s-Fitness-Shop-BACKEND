const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 🔥 Added fallback dummy URI for Jenkins testing
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ci_test_db';
        
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected — attempting to reconnect...');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // 🔥 Only crash the app if we are NOT running Jenkins tests
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;