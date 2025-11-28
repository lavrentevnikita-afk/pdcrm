const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function hashAccessCode(rawCode) {
  return crypto.createHash('sha256').update(String(rawCode)).digest('hex');
}

function createToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
}

function buildPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      const error = new Error('Поле accessCode обязательно');
      error.status = 400;
      throw error;
    }

    const hash = hashAccessCode(accessCode);
    const user = await userModel.getByAccessCodeHash(hash);

    if (!user) {
      const error = new Error('Неверный код доступа');
      error.status = 401;
      throw error;
    }

    const token = createToken(user);

    // Простая демо-логика: базовое количество непрочитанных уведомлений
    const unreadNotifications = 3;

    res.json({
      token,
      user: buildPublicUser(user),
      unreadNotifications,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    if (!req.user) {
      const error = new Error('Пользователь не авторизован');
      error.status = 401;
      throw error;
    }

    const user = await userModel.getById(req.user.id);

    if (!user) {
      const error = new Error('Пользователь не найден');
      error.status = 404;
      throw error;
    }

    const unreadNotifications = 3;

    res.json({
      user: buildPublicUser(user),
      unreadNotifications,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  me,
};
