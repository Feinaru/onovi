const router = require('express').Router();
const { register, login, me } = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', auth(), me);

module.exports = router;
