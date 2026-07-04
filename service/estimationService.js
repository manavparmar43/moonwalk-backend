const orderRepo = require('../repo/order.repo');
const { orderPrepMs } = require('../utils/orderPrepTime');

async function estimateOrder(order, restaurant) {
  const [pendingAheadCount, inProgressCount] = await Promise.all([
    orderRepo.countPendingAhead(restaurant.id, order.createdAt),
    orderRepo.countInProgress(restaurant.id),
  ]);

  const position = pendingAheadCount + inProgressCount + 1;
  const estimatedDuration = position * orderPrepMs(order);
  const updated = await orderRepo.updateEstimate(order.id, estimatedDuration);

  return { ...order, ...updated };
}

async function recomputePendingEstimates(restaurant) {
  const pendingOrders = await orderRepo.findPendingOrdered(restaurant.id);
  const updatedOrders = [];
  for (const order of pendingOrders) {
    updatedOrders.push(await estimateOrder(order, restaurant));
  }
  return updatedOrders;
}

module.exports = { estimateOrder, recomputePendingEstimates };
