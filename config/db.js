const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
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
        process.exit(1);
    }
};

module.exports = connectDB;