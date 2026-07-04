const jwt = require('jsonwebtoken');

const JWT_SECRET = 'change-this-secret-in-production';

const token = jwt.sign({ id: 2 }, JWT_SECRET);
console.log('Token for user 2 (SERVICE_PROVIDER):');
console.log(token);
