const kitchenResourceRoutes = require('express').Router();
const { chefList, chefCreate, chefDelete, chefUpdate } = require('../controllers/kitchenResource.controller');
const {
  createChefMiddleware,
  updateChefMiddleware,
  chefOwnershipMiddleware,
} = require('../middleware/kitchenResource.middleware');
const { requireAuth } = require('../middleware/token.middleware');

kitchenResourceRoutes.get('/', requireAuth, chefList);
kitchenResourceRoutes.post('/', requireAuth, createChefMiddleware, chefCreate);
kitchenResourceRoutes.patch('/:id', requireAuth, chefOwnershipMiddleware, updateChefMiddleware, chefUpdate);
kitchenResourceRoutes.delete('/:id', requireAuth, chefOwnershipMiddleware, chefDelete);

module.exports = kitchenResourceRoutes;
