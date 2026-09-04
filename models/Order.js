const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [
        {
            product: { type: String, required: true },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
            image: { type: String }
        }
    ],
    shippingAddress: {
        address: { type: String },
        city: { type: String },
        postalCode: { type: String },
        country: { type: String, default: 'India' }
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: 'Completed' },

    // 🔥 THE FIX: THIS LINE STOPS MONGODB FROM DELETING YOUR CANCEL REASON!
    cancelReason: { type: String },

    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);