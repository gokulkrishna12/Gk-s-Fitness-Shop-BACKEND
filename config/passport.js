const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // 🔥 FIX: Stop Passport from guessing HTTP. Force it to use the exact HTTPS link from your .env!
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if the user already exists in your database
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists
                return done(null, user);
            }

            // 2. Auto-register them using their Google details
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                // Generate a secure, random dummy password
                password: Math.random().toString(36).slice(-8) + Date.now(),
                isVerified: true,
                role: 'customer'
            });

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }
));

module.exports = passport;