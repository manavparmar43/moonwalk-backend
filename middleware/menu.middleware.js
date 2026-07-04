const restaurantRepo = require('../repo/restaurant.repo');
const menuRepo = require('../repo/menu.repo');
const { errorHandler } = require('../utils/errorHandler');

async function menuRestaurantMiddleware(req, res, next) {
  const restaurant = await restaurantRepo.findById(req.params.restaurantId);
  if (!restaurant) return errorHandler(res, 404, 'Restaurant not found');

  req.restaurant = restaurant;
  return next();
}

function createMenuMiddleware(req, res, next) {
  const { name, prepTimeMinutes, price } = req.body;
  if (!name || !prepTimeMinutes || price == null || Number(price) < 0) {
    return errorHandler(res, 400, 'name, prepTimeMinutes and price are required');
  }
  return next();
}

async function menuOwnershipMiddleware(req, res, next) {
  const item = await menuRepo.findById(req.params.id);
  if (!item || item.restaurantId !== req.user.restaurantId) {
    return errorHandler(res, 404, 'Menu item not found');
  }

  req.menuItem = item;
  return next();
}

module.exports = {
  menuRestaurantMiddleware,
  createMenuMiddleware,
  updateMenuMiddleware: createMenuMiddleware,
  menuOwnershipMiddleware,
};
