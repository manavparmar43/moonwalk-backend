const orderService = require('../service/order.service');

async function orderCreate(req, res) {
  const order = await orderService.createOrder(req.restaurant, req.body.customerName, req.body.customerEmail, {
    items: req.normalizedItems,
    chefId: req.normalizedChefId,
    chefName: req.normalizedChefName,
    orderPriority: req.normalizedPriority,
  });
  return res.status(201).json(order);
}

async function orderUpdate(req, res) {
  const order = await orderService.updateOrder(req.order, {
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
    items: req.normalizedItems,
    chefId: req.normalizedChefId,
    chefName: req.normalizedChefName,
    orderPriority: req.normalizedPriority,
  });
  return res.json(order);
}

async function orderGetById(req, res) {
  const order = await orderService.getOrder(req.order);
  return res.json(order);
}

async function orderList(req, res) {
  const orders = await orderService.listActiveAndRecent(req.user.restaurantId);
  return res.json(orders);
}

async function orderStart(req, res) {
  const order = await orderService.startOrder(req.order);
  return res.json(order);
}

async function orderStartBulk(req, res) {
  const orders = await orderService.startOrders(req.ordersToStart);
  return res.json(orders);
}

async function orderComplete(req, res) {
  const order = await orderService.completeOrder(req.order);
  return res.json(order);
}

async function orderCancel(req, res) {
  const order = await orderService.cancelOrder(req.order);
  return res.json(order);
}

async function orderDelete(req, res) {
  await orderService.deleteOrder(req.order);
  return res.status(204).send();
}

module.exports = {
  orderCreate,
  orderUpdate,
  orderGetById,
  orderList,
  orderStart,
  orderStartBulk,
  orderComplete,
  orderCancel,
  orderDelete,
};
