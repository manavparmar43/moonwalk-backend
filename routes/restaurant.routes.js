const restaurantRoutes = require('express').Router();
const { restaurantGetMine, restaurantUpdateCapacity } = require('../controllers/restaurant.controller');
const { updateCapacityMiddleware } = require('../middleware/restaurant.middleware');
const { requireAuth } = require('../middleware/token.middleware');

restaurantRoutes.get('/me', requireAuth, restaurantGetMine);
restaurantRoutes.patch('/capacity', requireAuth, updateCapacityMiddleware, restaurantUpdateCapacity);

module.exports = restaurantRoutes;
