//authRoutes.js
const { Router } = require('express');

const router = Router();
const authController = require('../controllers/authController');
const { verifyUser } = require('../middlewares/authMiddleware');

// public routes
router.post('/signup', authController.createUser);
router.post('/login', authController.loginUser);

// protected routes
router.get('/users', verifyUser, authController.getAllUsers);
router.get('/logout', verifyUser, authController.logoutUser);

module.exports = router;
