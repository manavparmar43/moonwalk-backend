const superuserRoutes = require('express').Router();
const { superuserRestaurantList } = require('../controllers/superuser.controller');
const { requireAuth, requireSuperUser } = require('../middleware/token.middleware');

superuserRoutes.get('/restaurants', requireAuth, requireSuperUser, superuserRestaurantList);

module.exports = superuserRoutes;
