// backend/middleware/uploadMiddleware.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary globally so it's ready for the controller!
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔥 THE FIX: Store files in RAM instantly instead of waiting for Cloudinary!
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;