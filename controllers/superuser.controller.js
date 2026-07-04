const restaurantRepo = require('../repo/restaurant.repo');

async function superuserRestaurantList(req, res) {
  const restaurants = await restaurantRepo.findAllWithCounts();
  return res.json(restaurants);
}

module.exports = { superuserRestaurantList };
