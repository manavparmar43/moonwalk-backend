const { errorHandler } = require('../utils/errorHandler');

function updateCapacityMiddleware(req, res, next) {
  const kitchenCapacity = Number(req.body.kitchenCapacity);
  if (!kitchenCapacity || kitchenCapacity < 1) {
    return errorHandler(res, 400, 'kitchenCapacity must be a positive number');
  }

  req.normalizedCapacity = kitchenCapacity;
  return next();
}

module.exports = { updateCapacityMiddleware };
