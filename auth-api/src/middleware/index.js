const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const idToken = req.cookies.access_token;
    if (!idToken) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
      const secret = process.env.JWT_SECRET || 'change-this-secret';
      const decoded = jwt.verify(idToken, secret);
      req.user = { uid: decoded.sub, email: decoded.email, role: decoded.role };
      next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Unauthorized' });
    }
};

module.exports = verifyToken;
