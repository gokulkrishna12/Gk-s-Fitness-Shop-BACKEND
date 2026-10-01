const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: 'customer' },
    isAdmin: { type: Boolean, required: true, default: false },

    // 🔥 NEW: Expo Push Notification Token
    expoPushToken: { type: String, default: null },

    // Cart and Wishlist for MongoDB Sync
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        qty: { type: Number, required: true, default: 1 }
    }]
}, { timestamps: true });

userSchema.pre('save', async function () {
    // If we are just updating the cart, wishlist, or push token, SKIP hashing the password!
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);