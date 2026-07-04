const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/envConfig');
const { decrypt } = require('../utils/crypto');
const { errorHandler } = require('../utils/errorHandler');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const encryptedToken = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!encryptedToken) {
    return errorHandler(res, 401, 'Missing token');
  }

  try {
    const rawToken = decrypt(encryptedToken);
    req.user = jwt.verify(rawToken, secretKey);
    return next();
  } catch (err) {
    return errorHandler(res, 401, 'Invalid or expired token');
  }
}

function requireSuperUser(req, res, next) {
  if (!req.user.isSuperUser) {
    return errorHandler(res, 403, 'Super user access required');
  }
  return next();
}

module.exports = { requireAuth, requireSuperUser };
