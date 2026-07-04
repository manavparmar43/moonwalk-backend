const { prisma } = require('../config/databaseInit');

function create({ restaurantId, chefName, chefEmail, status, maxConcurrentOrders }) {
  return prisma.kitchenResource.create({
    data: { restaurantId, chefName, chefEmail, status, maxConcurrentOrders },
  });
}

function findByRestaurantId(restaurantId) {
  return prisma.kitchenResource.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'asc' },
  });
}

function findById(id) {
  return prisma.kitchenResource.findUnique({ where: { id } });
}

function hardDelete(id) {
  return prisma.kitchenResource.delete({ where: { id } });
}

function update(id, { chefName, chefEmail, status, maxConcurrentOrders }) {
  return prisma.kitchenResource.update({
    where: { id },
    data: { chefName, chefEmail, status, maxConcurrentOrders },
  });
}

module.exports = { create, findByRestaurantId, findById, hardDelete, update };
