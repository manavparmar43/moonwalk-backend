const kitchenResourceRepo = require('../repo/kitchenResource.repo');
const { errorHandler } = require('../utils/errorHandler');

const VALID_STATUSES = ['active', 'inactive'];

function createChefMiddleware(req, res, next) {
  const { chefName, chefEmail, status, maxConcurrentOrders } = req.body;

  if (!chefName || !chefEmail) {
    return errorHandler(res, 400, 'chefName and chefEmail are required');
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return errorHandler(res, 400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (maxConcurrentOrders != null && Number(maxConcurrentOrders) < 1) {
    return errorHandler(res, 400, 'maxConcurrentOrders must be at least 1');
  }

  req.normalizedChef = {
    chefName,
    chefEmail,
    status: status || 'active',
    maxConcurrentOrders: Number(maxConcurrentOrders) || 1,
  };
  return next();
}

async function chefOwnershipMiddleware(req, res, next) {
  const chef = await kitchenResourceRepo.findById(req.params.id);
  if (!chef || chef.restaurantId !== req.user.restaurantId) {
    return errorHandler(res, 404, 'Chef not found');
  }

  req.chef = chef;
  return next();
}

module.exports = {
  createChefMiddleware,
  updateChefMiddleware: createChefMiddleware,
  chefOwnershipMiddleware,
};
