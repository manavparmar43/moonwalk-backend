const authService = require('../service/auth.service');

async function userRegister(req, res) {
  const { restaurantName, kitchenCapacity, adminName, email, password } = req.body;

  const result = await authService.register({
    restaurantName,
    kitchenCapacity: Number(kitchenCapacity) || undefined,
    adminName,
    email,
    password,
  });

  return res.status(201).json(result);
}

function userLogin(req, res) {
  const result = authService.login(req.loginUser);
  return res.json(result);
}

async function createSuperUser(req, res) {
  try {
    const result = await authService.createSuperUserOnce();
    return res.status(201).json({ success: true, message: 'Superuser created', ...result });
  } catch (err) {
    return res.status(err.status || 409).json({ success: false, message: err.message });
  }
}

module.exports = { userRegister, userLogin, createSuperUser };
