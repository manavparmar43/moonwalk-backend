const request = require('supertest');
const server = require('../app');
const { prisma } = require('../config/databaseInit');

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

test('a restaurant can register, take an order, and complete it', async () => {
  const email = `admin-${Date.now()}@test.com`;

  const registerRes = await request(server).post('/api/auth/register').send({
    restaurantName: 'Test Restaurant',
    kitchenCapacity: 1,
    adminName: 'Admin',
    email,
    password: 'password123',
  });
  expect(registerRes.status).toBe(201);
  const token = registerRes.body.token;
  const restaurantId = registerRes.body.restaurant.id;

  const menuRes = await request(server)
    .post('/api/menu')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Burger', prepTimeMinutes: 5, price: 150 });
  expect(menuRes.status).toBe(201);
  expect(menuRes.body.price).toBe(150);
  const menuItemId = menuRes.body.id;

  const orderRes = await request(server).post('/api/orders').send({
    restaurantId,
    customerName: 'Alice',
    customerEmail: 'alice@test.com',
    items: [{ menuItemId, quantity: 1 }],
  });
  expect(orderRes.status).toBe(201);
  expect(orderRes.body.status).toBe('IN_PROGRESS');
  expect(orderRes.body.startedAt).toBeDefined();
  expect(orderRes.body.estimatedDuration).toBeDefined();
  expect(typeof orderRes.body.orderNum).toBe('number');
  const orderId = orderRes.body.id;

  const fetchedRes = await request(server).get(`/api/orders/${orderId}`);
  expect(fetchedRes.status).toBe(200);
  expect(fetchedRes.body.status).toBe('IN_PROGRESS');

  const secondOrderRes = await request(server).post('/api/orders').send({
    restaurantId,
    customerName: 'Bob',
    customerEmail: 'bob@test.com',
    items: [{ menuItemId, quantity: 1 }],
  });
  expect(secondOrderRes.body.orderNum).toBe(orderRes.body.orderNum + 1);
  const secondStartRes = await request(server)
    .patch(`/api/orders/${secondOrderRes.body.id}/start`)
    .set('Authorization', `Bearer ${token}`);
  expect(secondStartRes.status).toBe(409);

  const completeRes = await request(server)
    .patch(`/api/orders/${orderId}/complete`)
    .set('Authorization', `Bearer ${token}`);
  expect(completeRes.status).toBe(200);
  expect(completeRes.body.status).toBe('COMPLETED');
  expect(completeRes.body.completedAt).toBeDefined();
});
