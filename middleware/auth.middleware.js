const bcrypt = require('bcryptjs');
const userRepo = require('../repo/user.repo');
const { decrypt } = require('../utils/crypto');
const { errorHandler } = require('../utils/errorHandler');

async function registerMiddleware(req, res, next) {
  const { restaurantName, adminName, email, password } = req.body;

  if (!restaurantName || !adminName || !email || !password) {
    return errorHandler(res, 400, 'Missing required fields');
  }

  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) return errorHandler(res, 409, 'Email already registered');

  return next();
}

async function loginMiddleware(req, res, next) {
  const { payload } = req.body;
  if (!payload) {
    return errorHandler(res, 400, 'Email and password are required');
  }

  let email, password;
  try {
    ({ email, password } = JSON.parse(decrypt(payload)));
  } catch (err) {
    return errorHandler(res, 400, 'Invalid login payload');
  }

  if (!email || !password) {
    return errorHandler(res, 400, 'Email and password are required');
  }

  const user = await userRepo.findByEmail(email);
  if (!user) return errorHandler(res, 401, 'Invalid email or password');

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) return errorHandler(res, 401, 'Invalid email or password');

  req.loginUser = user;
  return next();
}

module.exports = { registerMiddleware, loginMiddleware };
