const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    images: [{ type: String }], // Array of S3 URLs
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