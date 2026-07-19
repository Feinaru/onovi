const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { jwtSecret } = require('../config/security');
const prisma = new PrismaClient();

function auth(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const payload = jwt.verify(token, jwtSecret);

      // Fetch full user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true, email: true, phone: true, fullName: true }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
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
