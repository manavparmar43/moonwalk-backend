const { prisma } = require('../config/databaseInit');

function create({ name, kitchenCapacity }) {
  return prisma.restaurant.create({
    data: { name, kitchenCapacity },
  });
}

function findById(id) {
  return prisma.restaurant.findUnique({ where: { id } });
}

function updateCapacity(id, kitchenCapacity) {
  return prisma.restaurant.update({ where: { id }, data: { kitchenCapacity } });
}

function findAllWithCounts() {
  return prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, menuItems: true, orders: true } } },
  });
}

module.exports = { create, findById, updateCapacity, findAllWithCounts };
