const restaurantRepo = require('../repo/restaurant.repo');
const estimationService = require('../service/estimationService');

async function restaurantGetMine(req, res) {
  const restaurant = await restaurantRepo.findById(req.user.restaurantId);
  return res.json(restaurant);
}

async function restaurantUpdateCapacity(req, res) {
  const restaurant = await restaurantRepo.updateCapacity(req.user.restaurantId, req.normalizedCapacity);
  await estimationService.recomputePendingEstimates(restaurant);
  return res.json(restaurant);
}

module.exports = { restaurantGetMine, restaurantUpdateCapacity };
