const { prisma } = require('../config/databaseInit');

const withRestaurant = { restaurant: { select: { name: true } } };

function create({ restaurantId, customerName, customerEmail, items, chefId, chefName, orderPriority }) {
  return prisma.$transaction(async (tx) => {
    const { _max } = await tx.order.aggregate({
      where: { restaurantId },
      _max: { orderNum: true },
    });
    const orderNum = (_max.orderNum || 0) + 1;

    return tx.order.create({
      data: { restaurantId, orderNum, customerName, customerEmail, items, chefId, chefName, orderPriority },
      include: withRestaurant,
    });
  });
}

function findById(id) {
  return prisma.order.findUnique({ where: { id }, include: withRestaurant });
}

function countPendingAhead(restaurantId, createdAt) {
  return prisma.order.count({
    where: { restaurantId, status: 'PENDING', createdAt: { lt: createdAt } },
  });
}

function countInProgress(restaurantId) {
  return prisma.order.count({
    where: { restaurantId, status: 'IN_PROGRESS' },
  });
}

function countInProgressByChef(chefId) {
  return prisma.order.count({
    where: { chefId, status: 'IN_PROGRESS' },
  });
}

function countInProgressUnassigned(restaurantId) {
  return prisma.order.count({
    where: { restaurantId, status: 'IN_PROGRESS', chefId: null },
  });
}

function findRecentByRestaurant(restaurantId, limit = 50) {
  return prisma.order.findMany({
    where: { restaurantId },
    include: withRestaurant,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

function findPendingAhead(restaurantId, createdAt) {
  return prisma.order.findMany({
    where: { restaurantId, status: 'PENDING', createdAt: { lt: createdAt } },
    include: withRestaurant,
    orderBy: { createdAt: 'asc' },
  });
}

function findPendingOrdered(restaurantId) {
  return prisma.order.findMany({
    where: { restaurantId, status: 'PENDING' },
    include: withRestaurant,
    orderBy: { createdAt: 'asc' },
  });
}

function findInProgress(restaurantId) {
  return prisma.order.findMany({
    where: { restaurantId, status: 'IN_PROGRESS' },
    include: withRestaurant,
    orderBy: { startedAt: 'asc' },
  });
}

function appendStatusHistory(id, statusHistory) {
  return prisma.order.update({ where: { id }, data: { statusHistory } });
}

function updateDetails(id, { customerName, customerEmail, items, chefId, chefName, orderPriority }) {
  return prisma.order.update({
    where: { id },
    data: { customerName, customerEmail, items, chefId, chefName, orderPriority },
    include: withRestaurant,
  });
}

function updateEstimate(id, estimatedDuration) {
  return prisma.order.update({
    where: { id },
    data: { estimatedDuration },
  });
}

function markInProgress(id, startedAt) {
  return prisma.order.update({
    where: { id },
    data: { status: 'IN_PROGRESS', startedAt },
  });
}

function findByIdsForRestaurant(restaurantId, ids) {
  return prisma.order.findMany({
    where: { restaurantId, id: { in: ids } },
    include: withRestaurant,
  });
}

function markCompleted(id, completedAt) {
  return prisma.order.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt },
  });
}

function markCancelled(id) {
  return prisma.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

function hardDelete(id) {
  return prisma.order.delete({ where: { id } });
}

module.exports = {
  create,
  findById,
  countPendingAhead,
  countInProgress,
  countInProgressByChef,
  countInProgressUnassigned,
  findRecentByRestaurant,
  findPendingAhead,
  findPendingOrdered,
  findInProgress,
  updateEstimate,
  appendStatusHistory,
  updateDetails,
  markInProgress,
  findByIdsForRestaurant,
  markCompleted,
  markCancelled,
  hardDelete,
};
