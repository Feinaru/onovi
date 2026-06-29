const jwt = require('jsonwebtoken');

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { auth, requireRole };
