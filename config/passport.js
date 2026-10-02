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
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // 🔥 FIX: Ensure you are upgraded to Admin even if you registered earlier as a customer
                if (user.email === 'gokuldinesh32@gmail.com' && user.role !== 'admin') {
                    user.role = 'admin';
                    await user.save();
                }
                return done(null, user);
            }

            // 🔥 FIX: Automatically make your specific email the Admin on first creation!
            const isOwner = profile.emails[0].value === 'gokuldinesh32@gmail.com';

            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                password: Math.random().toString(36).slice(-8) + Date.now(),
                isVerified: true,
                role: isOwner ? 'admin' : 'customer'
            });

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }
));

module.exports = passport;