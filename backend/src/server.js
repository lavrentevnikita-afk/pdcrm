require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knexLib = require('knex');
const knexConfig = require('../knexfile')[process.env.NODE_ENV || 'development'];

const app = express();
const knex = knexLib(knexConfig);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

// Basic middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helper to create JWT
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error('JWT verify error', err);
    return res.status(401).json({ message: 'Сессия истекла, войдите снова' });
  }
}

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Код доступа обязателен' });
    }

    const users = await knex('users').where({ is_active: 1 });

    let matchedUser = null;
    for (const user of users) {
      const ok = await bcrypt.compare(code, user.access_code_hash);
      if (ok) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ message: 'Неверный код доступа' });
    }

    const token = createToken(matchedUser);

    return res.json({
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await knex('users')
      .select('id', 'name', 'role', 'is_active')
      .where({ id: req.user.id })
      .first();

    if (!user || !user.is_active) {
      return res
        .status(401)
        .json({ message: 'Пользователь не найден или отключен' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    return next(err);
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PDCRM backend listening on port ${PORT}`);
});
