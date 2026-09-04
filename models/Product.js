const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Link product to the Admin who created it
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },

    // Stock fields
    stock: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, default: 0 },

    price: { type: Number, required: true },

    // Image fields
    images: [{ type: String }], // Array of S3/Cloudinary URLs
    image: { type: String }, // Single fallback image

    // 🔥 THE FIX: Added rating and numReviews so the stars actually save to the DB!
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },

    attributes: {
        flavor: { type: String },
        weight: { type: String }, // e.g., '2kg', '5lbs'
        goal: [{ type: String }] // e.g., ['fat loss', 'muscle gain', 'beginner']
    },

    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            // 🔥 THE FIX: Added the name field so MongoDB actually saves it!
            name: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String },
            image: { type: String },
            createdAt: { type: Date, default: Date.now } // Added this so "Just now" updates to a real date!
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema, 'productss');