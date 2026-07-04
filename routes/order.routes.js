const orderRoutes = require('express').Router();
const {
  orderCreate,
  orderUpdate,
  orderGetById,
  orderList,
  orderStart,
  orderStartBulk,
  orderComplete,
  orderCancel,
  orderDelete,
} = require('../controllers/order.controller');
const {
  createOrderMiddleware,
  createAdminOrderMiddleware,
  updateOrderMiddleware,
  getOrderMiddleware,
  orderOwnershipMiddleware,
  startOrderMiddleware,
  startBulkMiddleware,
  completeOrderMiddleware,
  cancelOrderMiddleware,
} = require('../middleware/order.middleware');
const { requireAuth } = require('../middleware/token.middleware');

orderRoutes.post('/', createOrderMiddleware, orderCreate);
orderRoutes.post('/admin', requireAuth, createAdminOrderMiddleware, orderCreate);
orderRoutes.patch('/start-bulk', requireAuth, startBulkMiddleware, orderStartBulk);
orderRoutes.get('/:id', getOrderMiddleware, orderGetById);
orderRoutes.get('/', requireAuth, orderList);
orderRoutes.patch('/:id', requireAuth, orderOwnershipMiddleware, updateOrderMiddleware, orderUpdate);
orderRoutes.patch('/:id/start', requireAuth, orderOwnershipMiddleware, startOrderMiddleware, orderStart);
orderRoutes.patch('/:id/complete', requireAuth, orderOwnershipMiddleware, completeOrderMiddleware, orderComplete);
orderRoutes.patch('/:id/cancel', requireAuth, orderOwnershipMiddleware, cancelOrderMiddleware, orderCancel);
orderRoutes.delete('/:id', requireAuth, orderOwnershipMiddleware, orderDelete);

module.exports = orderRoutes;
