const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    // Step 1: Verify the JWT itself
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('\n🛑 JWT VERIFICATION FAILED:', error.message, '\n');
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Step 2: Look up the user (separate try/catch so DB errors aren't mislabeled as JWT errors)
    try {
      const userId = decoded.id || decoded.userId || decoded._id;
      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        console.log("⚠️ AUTH ERROR: Token is valid, but User ID not found in database:", userId);
        return res.status(401).json({ message: 'User no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('\n🛑 DATABASE ERROR during auth lookup:', error.message, '\n');
      return res.status(503).json({ message: 'Service temporarily unavailable, please try again' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin === true || req.user.email.toLowerCase() === 'gokuldinesh32@gmail.com')) {
    next();
  } else {
    console.log(`\n🚫 ADMIN ACCESS DENIED! The frontend sent a token belonging to: ${req.user ? req.user.email : 'Unknown'}\n`);
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };