const menuRoutes = require('express').Router();
const { menuList, menuCreate, menuDelete, menuUpdate } = require('../controllers/menu.controller');
const {
  menuRestaurantMiddleware,
  createMenuMiddleware,
  updateMenuMiddleware,
  menuOwnershipMiddleware,
} = require('../middleware/menu.middleware');
const { requireAuth } = require('../middleware/token.middleware');

menuRoutes.get('/:restaurantId', menuRestaurantMiddleware, menuList);
menuRoutes.post('/', requireAuth, createMenuMiddleware, menuCreate);
menuRoutes.patch('/:id', requireAuth, menuOwnershipMiddleware, updateMenuMiddleware, menuUpdate);
menuRoutes.delete('/:id', requireAuth, menuOwnershipMiddleware, menuDelete);

module.exports = menuRoutes;
