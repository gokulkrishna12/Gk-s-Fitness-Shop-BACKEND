const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists; Passport passes their existing role from MongoDB automatically!
                return done(null, user);
            }

            // 2. Auto-register new users as 'customer' by default
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
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