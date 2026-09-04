const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: 'customer' },
    isAdmin: { type: Boolean, required: true, default: false },

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

// 🔥 THE FIX: Removed 'next'. Modern async Mongoose hooks don't use callbacks, they use Promises!
userSchema.pre('save', async function () {
    // If we are just updating the cart or wishlist, SKIP hashing the password!
    if (!this.isModified('password')) {
        return;
    }

    // Only runs if the user is changing or creating their password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);