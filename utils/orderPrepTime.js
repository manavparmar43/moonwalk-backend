function orderPrepMs(order) {
  const totalMinutes = order.items.reduce((sum, item) => sum + item.prepTimeMinutes * item.quantity, 0);
  return totalMinutes * 60 * 1000;
}

module.exports = { orderPrepMs };
