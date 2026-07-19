const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function signUser(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register(req, res, next) {
  try {
    const { fullName, phone, email, password, role } = req.body;
    if (!fullName || !phone || !password || !role) {
      return res.status(400).json({ message: 'fullName, phone, password and role are required' });
    }

    if (!['CUSTOMER', 'BUSINESS'].includes(role)) {
      return res.status(400).json({ message: 'role must be CUSTOMER or BUSINESS' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] }
    });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, phone, email: email || null, passwordHash, role }
    });

    res.status(201).json({ user: publicUser(user), token: signUser(user) });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'phone and password are required' });

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(401).json({ message: 'Invalid phone or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid phone or password' });

    res.json({ user: publicUser(user), token: signUser(user) });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Phase 1: expose auth/onboarding metadata (fields are already part of the User row).
    res.json({
      ...publicUser(user),
      onboardingStatus: user.onboardingStatus,
      onboardingType: user.onboardingType,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me };
