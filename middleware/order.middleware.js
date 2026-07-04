const restaurantRepo = require('../repo/restaurant.repo');
const menuRepo = require('../repo/menu.repo');
const orderRepo = require('../repo/order.repo');
const kitchenResourceRepo = require('../repo/kitchenResource.repo');
const { errorHandler } = require('../utils/errorHandler');

const VALID_PRIORITIES = ['normal', 'urgent'];

async function validateItems(restaurantId, items) {
  const requestedItems = items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: Number(item.quantity) || 1,
  }));

  const menuItems = await menuRepo.findByIds(requestedItems.map((item) => item.menuItemId));
  const menuItemById = new Map(menuItems.filter((m) => m.restaurantId === restaurantId).map((m) => [m.id, m]));

  const allValid = requestedItems.every((item) => menuItemById.has(item.menuItemId));
  if (!allValid) return null;

  return requestedItems.map((item) => {
    const menuItem = menuItemById.get(item.menuItemId);
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      prepTimeMinutes: menuItem.prepTimeMinutes,
      quantity: item.quantity,
    };
  });
}

async function createOrderMiddleware(req, res, next) {
  const { restaurantId, customerName, customerEmail, items } = req.body;

  if (!restaurantId || !customerName || !customerEmail || !items || items.length === 0) {
    return errorHandler(res, 400, 'restaurantId, customerName, customerEmail and items are required');
  }

  const restaurant = await restaurantRepo.findById(restaurantId);
  if (!restaurant) return errorHandler(res, 404, 'Restaurant not found');

  const normalizedItems = await validateItems(restaurant.id, items);
  if (!normalizedItems) return errorHandler(res, 400, 'One or more menu items are invalid for this restaurant');

  req.restaurant = restaurant;
  req.normalizedItems = normalizedItems;
  req.normalizedChefId = null;
  req.normalizedChefName = null;
  req.normalizedPriority = 'normal';
  return next();
}

async function createAdminOrderMiddleware(req, res, next) {
  const { customerName, customerEmail, items, chefId, orderPriority } = req.body;

  if (!customerName || !customerEmail || !items || items.length === 0) {
    return errorHandler(res, 400, 'customerName, customerEmail and items are required');
  }
  if (orderPriority && !VALID_PRIORITIES.includes(orderPriority)) {
    return errorHandler(res, 400, `orderPriority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  const restaurant = await restaurantRepo.findById(req.user.restaurantId);
  if (!restaurant) return errorHandler(res, 404, 'Restaurant not found');

  const normalizedItems = await validateItems(restaurant.id, items);
  if (!normalizedItems) return errorHandler(res, 400, 'One or more menu items are invalid for this restaurant');

  let chef = null;
  if (chefId) {
    chef = await kitchenResourceRepo.findById(chefId);
    if (!chef || chef.restaurantId !== restaurant.id) {
      return errorHandler(res, 400, 'Selected chef is invalid for this restaurant');
    }
  }

  req.restaurant = restaurant;
  req.normalizedItems = normalizedItems;
  req.normalizedChefId = chef ? chef.id : null;
  req.normalizedChefName = chef ? chef.chefName : null;
  req.normalizedPriority = orderPriority || 'normal';
  return next();
}

async function updateOrderMiddleware(req, res, next) {
  if (req.order.status !== 'PENDING') {
    return errorHandler(res, 400, 'Only a pending order can be edited');
  }

  const { customerName, customerEmail, items, chefId, orderPriority } = req.body;

  if (!customerName || !customerEmail || !items || items.length === 0) {
    return errorHandler(res, 400, 'customerName, customerEmail and items are required');
  }
  if (orderPriority && !VALID_PRIORITIES.includes(orderPriority)) {
    return errorHandler(res, 400, `orderPriority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  const normalizedItems = await validateItems(req.order.restaurantId, items);
  if (!normalizedItems) return errorHandler(res, 400, 'One or more menu items are invalid for this restaurant');

  let chef = null;
  if (chefId) {
    chef = await kitchenResourceRepo.findById(chefId);
    if (!chef || chef.restaurantId !== req.order.restaurantId) {
      return errorHandler(res, 400, 'Selected chef is invalid for this restaurant');
    }
  }

  req.normalizedItems = normalizedItems;
  req.normalizedChefId = chef ? chef.id : null;
  req.normalizedChefName = chef ? chef.chefName : null;
  req.normalizedPriority = orderPriority || 'normal';
  return next();
}

async function getOrderMiddleware(req, res, next) {
  const order = await orderRepo.findById(req.params.id);
  if (!order) return errorHandler(res, 404, 'Order not found');

  req.order = order;
  return next();
}

async function orderOwnershipMiddleware(req, res, next) {
  const order = await orderRepo.findById(req.params.id);
  if (!order || order.restaurantId !== req.user.restaurantId) {
    return errorHandler(res, 404, 'Order not found');
  }

  req.order = order;
  return next();
}

async function availableSlotsFor(order) {
  if (order.chefId) {
    const chef = await kitchenResourceRepo.findById(order.chefId);
    const inProgress = await orderRepo.countInProgressByChef(order.chefId);
    return (chef ? chef.maxConcurrentOrders : 1) - inProgress;
  }
  const restaurant = await restaurantRepo.findById(order.restaurantId);
  const inProgress = await orderRepo.countInProgressUnassigned(order.restaurantId);
  return restaurant.kitchenCapacity - inProgress;
}

async function startOrderMiddleware(req, res, next) {
  if (req.order.status !== 'PENDING') {
    return errorHandler(res, 400, 'Only a pending order can be started');
  }

  const freeSlots = await availableSlotsFor(req.order);
  if (freeSlots <= 0) {
    const message = req.order.chefId
      ? 'Chef is at full capacity, complete an order first'
      : 'Kitchen is at full capacity, complete an order first';
    return errorHandler(res, 409, message);
  }

  return next();
}

async function startBulkMiddleware(req, res, next) {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return errorHandler(res, 400, 'orderIds must be a non-empty array');
  }

  const orders = await orderRepo.findByIdsForRestaurant(req.user.restaurantId, orderIds);
  if (orders.length !== orderIds.length) {
    return errorHandler(res, 404, 'One or more orders were not found');
  }
  if (!orders.every((o) => o.status === 'PENDING')) {
    return errorHandler(res, 400, 'Only pending orders can be started');
  }

  const restaurant = await restaurantRepo.findById(req.user.restaurantId);
  const chefRemaining = new Map();
  let unassignedRemaining = null;

  for (const order of orders) {
    if (order.chefId) {
      if (!chefRemaining.has(order.chefId)) {
        const chef = await kitchenResourceRepo.findById(order.chefId);
        const inProgress = await orderRepo.countInProgressByChef(order.chefId);
        chefRemaining.set(order.chefId, (chef ? chef.maxConcurrentOrders : 1) - inProgress);
      }
      const remaining = chefRemaining.get(order.chefId);
      if (remaining <= 0) {
        return errorHandler(res, 409, 'Chef is at full capacity for one or more selected orders');
      }
      chefRemaining.set(order.chefId, remaining - 1);
    } else {
      if (unassignedRemaining === null) {
        const inProgress = await orderRepo.countInProgressUnassigned(req.user.restaurantId);
        unassignedRemaining = restaurant.kitchenCapacity - inProgress;
      }
      if (unassignedRemaining <= 0) {
        return errorHandler(res, 409, 'Kitchen is at full capacity for one or more selected orders');
      }
      unassignedRemaining -= 1;
    }
  }

  req.ordersToStart = orders;
  return next();
}

function completeOrderMiddleware(req, res, next) {
  if (req.order.status !== 'IN_PROGRESS') {
    return errorHandler(res, 400, 'Only an in-progress order can be completed');
  }
  return next();
}

function cancelOrderMiddleware(req, res, next) {
  if (req.order.status === 'COMPLETED' || req.order.status === 'CANCELLED') {
    return errorHandler(res, 400, 'Order is already finished');
  }
  return next();
}

module.exports = {
  createOrderMiddleware,
  createAdminOrderMiddleware,
  updateOrderMiddleware,
  getOrderMiddleware,
  orderOwnershipMiddleware,
  startOrderMiddleware,
  startBulkMiddleware,
  completeOrderMiddleware,
  cancelOrderMiddleware,
};
