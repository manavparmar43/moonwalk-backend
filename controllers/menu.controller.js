const menuRepo = require('../repo/menu.repo');

async function menuList(req, res) {
  const items = await menuRepo.findByRestaurantId(req.restaurant.id);
  return res.json({ restaurant: req.restaurant, items });
}

async function menuCreate(req, res) {
  const { name, prepTimeMinutes, price } = req.body;
  const item = await menuRepo.create({
    restaurantId: req.user.restaurantId,
    name,
    prepTimeMinutes: Number(prepTimeMinutes),
    price: Number(price),
  });
  return res.status(201).json(item);
}

async function menuDelete(req, res) {
  await menuRepo.hardDelete(req.menuItem.id);
  return res.status(204).send();
}

async function menuUpdate(req, res) {
  const { name, prepTimeMinutes, price } = req.body;
  const item = await menuRepo.update(req.menuItem.id, {
    name,
    prepTimeMinutes: Number(prepTimeMinutes),
    price: Number(price),
  });
  return res.json(item);
}

module.exports = { menuList, menuCreate, menuDelete, menuUpdate };
