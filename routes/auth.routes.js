const userRoutes = require('express').Router();
const { userRegister, userLogin, createSuperUser } = require('../controllers/auth.controller');
const { registerMiddleware, loginMiddleware } = require('../middleware/auth.middleware');

userRoutes.post('/register', registerMiddleware, userRegister);
userRoutes.post('/login', loginMiddleware, userLogin);
userRoutes.get('/create-superuser', createSuperUser);

module.exports = userRoutes;
