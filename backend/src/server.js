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


// GET /api/dashboard/summary
app.get('/api/dashboard/summary', authMiddleware, async (req, res, next) => {
  try {
    const period = req.query.period || 'month';
    const now = new Date();
    let from = new Date(now);
    let periodLengthDays = 30;

    // Определяем начальную точку периода для сумм/статистики
    if (period === 'day') {
      from.setHours(0, 0, 0, 0);
      periodLengthDays = 1;
    } else if (period === 'week') {
      // прошлые 7 дней
      from.setDate(from.getDate() - 7);
      periodLengthDays = 7;
    } else {
      // по умолчанию — условный месяц (30 дней)
      from.setDate(from.getDate() - 30);
      periodLengthDays = 30;
    }

    // SQLite хранит даты как текст, сравниваем по ISO-строке
    const fromIso = from.toISOString();

    // Загружаем заказы для выбранного периода по created_at
    const periodOrders = await knex('orders')
      .where('created_at', '>=', fromIso);

    const totalAmount = periodOrders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    );

    const activeStatuses = ['new', 'in_progress', 'production'];
    const activeCount = periodOrders.filter((o) =>
      activeStatuses.includes(o.status)
    ).length;
    const completedCount = periodOrders.filter(
      (o) => o.status === 'completed'
    ).length;

    // Прошлый период для расчёта процента изменения
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - periodLengthDays);
    const prevFromIso = prevFrom.toISOString();
    const prevToIso = fromIso;

    const previousOrders = await knex('orders')
      .where('created_at', '>=', prevFromIso)
      .andWhere('created_at', '<', prevToIso);

    const prevTotalAmount = previousOrders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    );

    let changePercent = null;
    if (prevTotalAmount > 0) {
      changePercent = ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100;
    } else if (totalAmount > 0) {
      changePercent = 100;
    }

    // График загруженности по текущей неделе (Mon–Sun) по дедлайнам
    const today = new Date();
    const jsDay = today.getDay(); // 0 (Sun) - 6 (Sat)
    const isoDow = jsDay === 0 ? 7 : jsDay; // 1 (Mon) - 7 (Sun)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (isoDow - 1));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekOrders = await knex('orders').whereBetween('deadline', [
      weekStart.toISOString(),
      weekEnd.toISOString(),
    ]);

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const workload = weekdays.map((label, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      const dayStr = day.toISOString().slice(0, 10); // YYYY-MM-DD

      const dayOrders = weekOrders.filter(
        (o) => (o.deadline || '').slice(0, 10) === dayStr
      );

      return {
        label,
        date: dayStr,
        orders: dayOrders.length,
        amount: dayOrders.reduce(
          (sum, o) => sum + Number(o.total_amount || 0),
          0
        ),
      };
    });

    // Горящие заказы — пометка is_hot или ближайшие дедлайны
    const hotOrders = await knex('orders')
      .where('is_hot', true)
      .orWhere('deadline', '>=', now.toISOString())
      .orderBy('deadline', 'asc')
      .limit(5);

    res.json({
      period,
      totalAmount,
      prevTotalAmount,
      changePercent,
      activeCount,
      completedCount,
      workload,
      hotOrders,
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
