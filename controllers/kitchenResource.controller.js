const kitchenResourceRepo = require('../repo/kitchenResource.repo');
const orderService = require('../service/order.service');

async function chefList(req, res) {
  const chefs = await kitchenResourceRepo.findByRestaurantId(req.user.restaurantId);
  return res.json(chefs);
}

async function chefCreate(req, res) {
  const chef = await kitchenResourceRepo.create({
    restaurantId: req.user.restaurantId,
    ...req.normalizedChef,
  });
  return res.status(201).json(chef);
}

async function chefDelete(req, res) {
  await kitchenResourceRepo.hardDelete(req.chef.id);
  return res.status(204).send();
}

async function chefUpdate(req, res) {
  const chef = await kitchenResourceRepo.update(req.chef.id, req.normalizedChef);
  await orderService.autoStartNext(req.user.restaurantId);
  return res.json(chef);
}

module.exports = { chefList, chefCreate, chefDelete, chefUpdate };
