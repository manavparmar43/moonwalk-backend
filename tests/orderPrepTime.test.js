const { orderPrepMs } = require('../utils/orderPrepTime');

describe('orderPrepMs', () => {
  test('sums prep time across items and quantities', () => {
    const order = {
      items: [
        { quantity: 2, prepTimeMinutes: 5 },
        { quantity: 1, prepTimeMinutes: 4 },
      ],
    };

    expect(orderPrepMs(order)).toBe(14 * 60 * 1000);
  });

  test('is zero for an order with no items', () => {
    expect(orderPrepMs({ items: [] })).toBe(0);
  });
});
