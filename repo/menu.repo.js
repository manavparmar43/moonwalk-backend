const { prisma } = require('../config/databaseInit');

function create({ restaurantId, name, prepTimeMinutes, price }) {
  return prisma.menuItem.create({
    data: { restaurantId, name, prepTimeMinutes, price },
  });
}

function findByRestaurantId(restaurantId) {
  return prisma.menuItem.findMany({
    where: { restaurantId, isAvailable: true },
    orderBy: { name: 'asc' },
  });
}

function findByIds(ids) {
  return prisma.menuItem.findMany({ where: { id: { in: ids } } });
}

function findById(id) {
  return prisma.menuItem.findUnique({ where: { id } });
}

function hardDelete(id) {
  return prisma.menuItem.delete({ where: { id } });
}

function update(id, { name, prepTimeMinutes, price }) {
  return prisma.menuItem.update({
    where: { id },
    data: { name, prepTimeMinutes, price },
  });
}

module.exports = { create, findByRestaurantId, findByIds, findById, hardDelete, update };
