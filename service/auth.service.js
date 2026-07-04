const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const restaurantRepo = require('../repo/restaurant.repo');
const userRepo = require('../repo/user.repo');
const { prisma } = require('../config/databaseInit');
const { secretKey, jwtExpiresIn } = require('../config/envConfig');
const { encrypt } = require('../utils/crypto');

function signToken(user) {
  const rawToken = jwt.sign(
    {
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
      isRestroAdmin: user.isRestroAdmin,
      isSuperUser: user.isSuperUser,
    },
    secretKey,
    { expiresIn: jwtExpiresIn }
  );

  return encrypt(rawToken);
}

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

async function register({ restaurantName, kitchenCapacity, adminName, email, password }) {
  const restaurant = await restaurantRepo.create({
    name: restaurantName,
    kitchenCapacity: kitchenCapacity || 1,
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepo.create({
    restaurantId: restaurant.id,
    name: adminName,
    email,
    passwordHash,
    role: 'ADMIN',
  });

  return { token: signToken(user), restaurant, user: toPublicUser(user) };
}

function login(user) {
  return { token: signToken(user), user: toPublicUser(user) };
}

async function createSuperUserOnce() {
  const existing = await userRepo.findSuperUser();
  if (existing) {
    const error = new Error('Superuser already exists');
    error.status = 409;
    throw error;
  }

  let restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    restaurant = await restaurantRepo.create({ name: 'MoonWalk', kitchenCapacity: 1 });
  }

  const email = 'super@gmail.com';
  const password = '1234';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await userRepo.createSuperUser({
    restaurantId: restaurant.id,
    name: 'Super Admin',
    email,
    passwordHash,
  });

  return { id: user.id, email: user.email, password };
}

module.exports = { register, login, createSuperUserOnce };
