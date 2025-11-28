const express = require('express');
const { login, me } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Авторизация по коду доступа
router.post('/login', login);

// Профиль текущего пользователя
router.get('/me', authenticateToken, me);

module.exports = router;
