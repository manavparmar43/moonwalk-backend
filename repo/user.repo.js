const { prisma } = require('../config/databaseInit');

function create({ restaurantId, name, email, passwordHash, role }) {
  return prisma.user.create({
    data: { restaurantId, name, email, passwordHash, role },
  });
}

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function createSuperUser({ restaurantId, name, email, passwordHash }) {
  return prisma.user.create({
    data: { restaurantId, name, email, passwordHash, role: 'ADMIN', isSuperUser: true },
  });
}

function findSuperUser() {
  return prisma.user.findFirst({ where: { isSuperUser: true } });
}

module.exports = { create, findByEmail, createSuperUser, findSuperUser };
