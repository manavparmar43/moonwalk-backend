const orderRepo = require('../repo/order.repo');
const restaurantRepo = require('../repo/restaurant.repo');
const kitchenResourceRepo = require('../repo/kitchenResource.repo');
const estimationService = require('./estimationService');
const { getIo } = require('../config/socketInit');
const { orderPrepMs } = require('../utils/orderPrepTime');
const { queueOrderConfirmationMail } = require('../mailManage/sendMail');
const { frontendUrl } = require('../config/envConfig');

function emitOrderUpdate(order) {
  getIo().to(`order:${order.id}`).emit('order:update', {
    orderId: order.id,
    status: order.status,
    startedAt: order.startedAt,
    prepTimeMs: orderPrepMs(order),
    estimatedDuration: order.estimatedDuration,
  });
}

async function recomputeAndPush(restaurantId) {
  const restaurant = await restaurantRepo.findById(restaurantId);
  const updatedOrders = await estimationService.recomputePendingEstimates(restaurant);
  updatedOrders.forEach(emitOrderUpdate);
}

function emitKitchenUpdate(restaurantId) {
  getIo().to(`restaurant:${restaurantId}`).emit('kitchen:update', { restaurantId });
}

function withPrepTimeMs(order) {
  return { ...order, prepTimeMs: orderPrepMs(order) };
}

async function logStatus(order, status) {
  const entry = {
    status,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - order.createdAt.getTime(),
    durationMs: orderPrepMs(order),
  };
  const statusHistory = [...(order.statusHistory || []), entry];
  await orderRepo.appendStatusHistory(order.id, statusHistory);
  return statusHistory;
}

async function createOrder(restaurant, customerName, customerEmail, { items, chefId, chefName, orderPriority }) {
  const order = await orderRepo.create({
    restaurantId: restaurant.id,
    customerName,
    customerEmail,
    items,
    chefId,
    chefName,
    orderPriority,
  });
  await estimationService.estimateOrder(order, restaurant);
  emitKitchenUpdate(restaurant.id);

  await autoStartNext(restaurant.id);
  const finalOrder = await orderRepo.findById(order.id);

  const trackingUrl = `${frontendUrl}/order/${order.id}`;
  const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
  queueOrderConfirmationMail({
    to: customerEmail,
    restaurantName: restaurant.name,
    customerName,
    trackingUrl,
    itemsSummary,
    estimatedDuration: finalOrder.estimatedDuration,
  });

  return withPrepTimeMs(finalOrder);
}

async function updateOrder(order, { customerName, customerEmail, items, chefId, chefName, orderPriority }) {
  const updated = await orderRepo.updateDetails(order.id, {
    customerName,
    customerEmail,
    items,
    chefId,
    chefName,
    orderPriority,
  });

  const restaurant = await restaurantRepo.findById(order.restaurantId);
  const estimated = await estimationService.estimateOrder(updated, restaurant);
  emitOrderUpdate(estimated);
  emitKitchenUpdate(order.restaurantId);
  await recomputeAndPush(order.restaurantId);

  return withPrepTimeMs(estimated);
}

async function getOrder(order) {
  const queuePosition =
    order.status === 'PENDING'
      ? await orderRepo.countPendingAhead(order.restaurantId, order.createdAt)
      : null;

  return { ...withPrepTimeMs(order), queuePosition };
}

async function listActiveAndRecent(restaurantId) {
  const orders = await orderRepo.findRecentByRestaurant(restaurantId);

  const pendingByAge = orders
    .filter((o) => o.status === 'PENDING')
    .sort((a, b) => a.createdAt - b.createdAt);

  return orders.map((order) => ({
    ...withPrepTimeMs(order),
    queuePosition: order.status === 'PENDING' ? pendingByAge.findIndex((o) => o.id === order.id) : null,
  }));
}

async function startOrder(order) {
  const startedAt = new Date();
  const updated = await orderRepo.markInProgress(order.id, startedAt);
  const updatedWithItems = { ...order, ...updated };

  updatedWithItems.statusHistory = await logStatus(updatedWithItems, 'IN_PROGRESS');

  emitOrderUpdate(updatedWithItems);
  emitKitchenUpdate(order.restaurantId);
  await recomputeAndPush(order.restaurantId);

  return withPrepTimeMs(updatedWithItems);
}

async function startOrders(orders) {
  const startedAt = new Date();
  const results = [];

  for (const order of orders) {
    const updated = await orderRepo.markInProgress(order.id, startedAt);
    const updatedWithItems = { ...order, ...updated };
    updatedWithItems.statusHistory = await logStatus(updatedWithItems, 'IN_PROGRESS');

    emitOrderUpdate(updatedWithItems);
    results.push(withPrepTimeMs(updatedWithItems));
  }

  emitKitchenUpdate(orders[0].restaurantId);
  await recomputeAndPush(orders[0].restaurantId);

  return results;
}

function byPriorityThenAge(a, b) {
  const priorityRank = (order) => (order.orderPriority === 'urgent' ? 0 : 1);
  return priorityRank(a) - priorityRank(b) || a.createdAt - b.createdAt;
}

async function autoStartNext(restaurantId) {
  const restaurant = await restaurantRepo.findById(restaurantId);
  const pending = await orderRepo.findPendingOrdered(restaurantId);
  if (pending.length === 0) return;

  const byChef = new Map();
  const unassigned = [];
  for (const order of pending) {
    if (order.chefId) {
      if (!byChef.has(order.chefId)) byChef.set(order.chefId, []);
      byChef.get(order.chefId).push(order);
    } else {
      unassigned.push(order);
    }
  }

  const toStart = [];

  for (const [chefId, chefOrders] of byChef) {
    const chef = await kitchenResourceRepo.findById(chefId);
    const inProgress = await orderRepo.countInProgressByChef(chefId);
    const freeSlots = (chef ? chef.maxConcurrentOrders : 1) - inProgress;
    if (freeSlots > 0) {
      toStart.push(...chefOrders.sort(byPriorityThenAge).slice(0, freeSlots));
    }
  }

  if (unassigned.length > 0) {
    const inProgress = await orderRepo.countInProgressUnassigned(restaurantId);
    const freeSlots = restaurant.kitchenCapacity - inProgress;
    if (freeSlots > 0) {
      toStart.push(...unassigned.sort(byPriorityThenAge).slice(0, freeSlots));
    }
  }

  if (toStart.length > 0) await startOrders(toStart);
}

async function completeOrder(order) {
  const completedAt = new Date();
  const updated = await orderRepo.markCompleted(order.id, completedAt);
  const updatedWithItems = { ...order, ...updated };

  updatedWithItems.statusHistory = await logStatus(updatedWithItems, 'COMPLETED');
  emitOrderUpdate(updatedWithItems);
  emitKitchenUpdate(order.restaurantId);
  await recomputeAndPush(order.restaurantId);
  await autoStartNext(order.restaurantId);

  return withPrepTimeMs(updatedWithItems);
}

async function cancelOrder(order) {
  const updated = await orderRepo.markCancelled(order.id);
  const updatedWithItems = { ...order, ...updated };

  updatedWithItems.statusHistory = await logStatus(updatedWithItems, 'CANCELLED');
  emitOrderUpdate(updatedWithItems);
  emitKitchenUpdate(order.restaurantId);
  await recomputeAndPush(order.restaurantId);
  await autoStartNext(order.restaurantId);

  return withPrepTimeMs(updatedWithItems);
}

async function deleteOrder(order) {
  await orderRepo.hardDelete(order.id);
  getIo().to(`order:${order.id}`).emit('order:deleted', { orderId: order.id });
  emitKitchenUpdate(order.restaurantId);
  await recomputeAndPush(order.restaurantId);
  await autoStartNext(order.restaurantId);
}

module.exports = {
  createOrder,
  updateOrder,
  getOrder,
  listActiveAndRecent,
  startOrder,
  startOrders,
  autoStartNext,
  completeOrder,
  cancelOrder,
  deleteOrder,
};
