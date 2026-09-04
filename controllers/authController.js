const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Send OTP for Registration
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists. Please login.' });

        const otp = generateOTP();

        await Otp.findOneAndUpdate(
            { email }, { otp, createdAt: Date.now() }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        sendEmail(email, 'GK\'s Fitness Shop - Verification OTP', `Your registration OTP is ${otp}. Valid for 5 minutes.`);

        res.status(200).json({ message: 'OTP sent to email successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. Verify OTP & Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({
            name,
            email,
            password,
            isVerified: true,
            role: 'customer',
            isAdmin: false,
            cart: [],
            wishlist: []
        });

        await Otp.deleteOne({ email });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
        );

        res.status(201).json({
            message: 'Registration successful!',
            token: token,
            user: { name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 3. Login with Email & Password
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 4. Send Forgot Password OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found with this email' });

        const otp = generateOTP();

        await Otp.findOneAndUpdate(
            { email }, { otp, createdAt: Date.now() }, { upsert: true, returnDocument: 'after' }
        );

        sendEmail(email, 'GK\'s Fitness Shop - Password Reset OTP', `Your password reset OTP is ${otp}. Valid for 5 minutes.`);

        res.status(200).json({ message: 'Password reset OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 5. Verify OTP & Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
        }

        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();

        await Otp.deleteOne({ email });

        res.status(200).json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 6. Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId || req.user.id;
        const user = await User.findById(userId);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                message: "Profile updated successfully",
                user: {
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 7. Sync Cart and Wishlist to Database
const syncUserData = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId || req.user.id;
        const { cart, wishlist } = req.body;

        const updateFields = {};

        if (cart !== undefined) {
            updateFields.cart = cart.map(item => ({
                product: item.product._id || item.product.id || item.product,
                qty: item.qty
            }));
        }
        if (wishlist !== undefined) {
            updateFields.wishlist = wishlist.map(item => item._id || item.id || item);
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: "Data synced successfully" });
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: 'Server error during sync', error: error.message });
    }
};

// 8. Fetch Cart and Wishlist from Database (WITH GHOST PRODUCT FIX)
const getUserData = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId || req.user.id;
        const user = await User.findById(userId)
            .populate('cart.product')
            .populate('wishlist');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // 🔥 AUTO-HEAL: Filter out deleted "Ghost" products (nulls)
        const validCart = user.cart.filter(item => item && item.product != null);
        const validWishlist = user.wishlist.filter(item => item != null);

        // If ghost products were found, silently update the DB to clean the user's cart forever
        if (validCart.length !== user.cart.length || validWishlist.length !== user.wishlist.length) {
            user.cart = validCart;
            user.wishlist = validWishlist;
            await user.save();
        }

        res.status(200).json({
            cart: validCart,
            wishlist: validWishlist
        });
    } catch (error) {
        console.error("Fetch User Data Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    sendOtp, registerUser, loginUser, forgotPassword, resetPassword, updateUserProfile,
    syncUserData, getUserData
};