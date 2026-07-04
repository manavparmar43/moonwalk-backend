const express = require('express');
const cors = require('cors');
const http = require('http');
const { port, corsOrigin } = require('./config/envConfig');
const { globalErrorHandler } = require('./utils/errorHandler');
const { disconnectDb } = require('./config/databaseInit');
const { initSocket } = require('./config/socketInit');

const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const superuserRoutes = require('./routes/superuser.routes');
const kitchenResourceRoutes = require('./routes/kitchenResource.routes');

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/superuser', superuserRoutes);
app.use('/api/chefs', kitchenResourceRoutes);

app.use(globalErrorHandler);

if (process.env.VERCEL) {
  module.exports = app;
} else {
  const server = http.createServer(app);
  initSocket(server);

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err.message));

  server.listen(port, () => console.log(`API listening on port ${port}`));

  module.exports = server;
}
