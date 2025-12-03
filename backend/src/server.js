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
      // access_code_hash хранит хэш кода
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

    const fromIso = from.toISOString();

    // Заказы текущего периода по created_at
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

    // Загрузка по неделе по дедлайнам
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
      .where((qb) => {
        qb.where('is_hot', true).orWhere('deadline', '>=', now.toISOString());
      })
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

// ===== Orders API =====

// Нормализация строки заказа для ответа API
function mapOrderRow(row) {
  if (!row) return null;

  const deadlineAt = row.deadline_at || row.deadline || null;
  const sum =
    row.sum_total != null
      ? row.sum_total
      : row.total_amount != null
      ? row.total_amount
      : 0;

  return {
    id: row.id,
    order_number: row.order_number,
    title: row.title,
    client_name: row.client_name || null,
    client_phone: row.client_phone || null,
    manager_id: row.manager_id || null,
    manager_name: row.manager_name || null,
    status: row.status,
    deadline_at: deadlineAt,
    sum_total: Number(sum) || 0,
    is_hot: !!row.is_hot,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /api/orders — список заказов
app.get('/api/orders', authMiddleware, async (req, res, next) => {
  try {
    const { search, status, date_from: dateFrom, date_to: dateTo, my } =
      req.query;

    let query = knex('orders as o').leftJoin('users as u', 'o.manager_id', 'u.id');

    // Поиск
    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      query = query.where((qb) => {
        qb.where('o.order_number', 'like', like)
          .orWhere('o.title', 'like', like)
          .orWhere('o.client_name', 'like', like)
          .orWhere('o.client_phone', 'like', like);
      });
    }

    // Фильтр по статусу
    if (status && status.trim() && status !== 'all') {
      const statuses = status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length) {
        query = query.whereIn('o.status', statuses);
      }
    }

    // Дата от / до
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!Number.isNaN(fromDate.getTime())) {
        query = query.where('o.deadline_at', '>=', fromDate.toISOString());
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!Number.isNaN(toDate.getTime())) {
        query = query.where('o.deadline_at', '<=', toDate.toISOString());
      }
    }

    // Только мои
    const myOnly =
      my === '1' ||
      my === 'true' ||
      my === true ||
      my === 1;

    if (myOnly) {
      if (!req.user || !req.user.id) {
        return res
          .status(400)
          .json({ message: 'Невозможно отфильтровать по ответственному' });
      }
      query = query.where('o.manager_id', req.user.id);
    }

    const rows = await query
      .select('o.*', 'u.name as manager_name')
      .orderByRaw("CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END")
      .orderBy('o.deadline_at', 'asc')
      .orderBy('o.id', 'desc');

    const items = rows.map(mapOrderRow);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

// GET /api/orders/:id — детали
app.get('/api/orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const row = await knex('orders as o')
      .leftJoin('users as u', 'o.manager_id', 'u.id')
      .select('o.*', 'u.name as manager_name')
      .where('o.id', id)
      .first();

    if (!row) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    return res.json(mapOrderRow(row));
  } catch (err) {
    return next(err);
  }
});

// Проверка прав на редактирование/удаление заказа
function canEditOrder(order, user) {
  if (!user) return false;

  const isOwner = order.manager_id === user.id;
  const isProductionOnProductionStatus =
    order.status === 'production' && user.role === 'production';
  const isBoss = ['admin', 'director'].includes(user.role);

  return isOwner || isProductionOnProductionStatus || isBoss;
}

// POST /api/orders — создание
app.post('/api/orders', authMiddleware, async (req, res, next) => {
  try {
    const {
      title,
      client_name: clientName,
      client_phone: clientPhone,
      status,
      deadline_at: deadlineAtRaw,
      sum_total: sumTotalRaw,
      is_hot: isHotRaw,
    } = req.body || {};

    if (!title || !deadlineAtRaw) {
      return res
        .status(400)
        .json({ message: 'Название и дедлайн обязательны' });
    }

    const deadlineDate = new Date(deadlineAtRaw);
    if (Number.isNaN(deadlineDate.getTime())) {
      return res
        .status(400)
        .json({ message: 'Некорректный формат дедлайна' });
    }

    const deadlineIso = deadlineDate.toISOString();
    const sum = Number(sumTotalRaw) || 0;

    // Генерация номера заказа
    const lastOrder = await knex('orders').orderBy('id', 'desc').first();
    let nextNumber = 1;
    if (lastOrder && lastOrder.order_number) {
      const match = String(lastOrder.order_number).match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      } else {
        nextNumber = (lastOrder.id || 0) + 1;
      }
    }
    const orderNumber = `PD-${String(nextNumber).padStart(4, '0')}`;

    const insertData = {
      order_number: orderNumber,
      title,
      client_name: clientName || null,
      client_phone: clientPhone || null,
      manager_id: req.user.id,
      status: status || 'new',
      deadline_at: deadlineIso,
      deadline: deadlineIso,
      sum_total: sum,
      total_amount: sum,
      is_hot: !!isHotRaw,
    };

    const [insertedId] = await knex('orders').insert(insertData);

    const created = await knex('orders as o')
      .leftJoin('users as u', 'o.manager_id', 'u.id')
      .select('o.*', 'u.name as manager_name')
      .where('o.id', insertedId)
      .first();

    return res.status(201).json(mapOrderRow(created));
  } catch (err) {
    return next(err);
  }
});

// PUT /api/orders/:id — редактирование заказа
app.put('/api/orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      client_name: clientName,
      client_phone: clientPhone,
      status,
      deadline_at: deadlineAtRaw,
      sum_total: sumTotalRaw,
      is_hot: isHotRaw,
    } = req.body || {};

    const row = await knex('orders').where({ id }).first();
    if (!row) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (!canEditOrder(row, req.user)) {
      return res
        .status(403)
        .json({ message: 'У вас нет прав редактировать этот заказ' });
    }

    const patch = {};

    if (title != null) patch.title = title;
    if (clientName !== undefined) patch.client_name = clientName || null;
    if (clientPhone !== undefined) patch.client_phone = clientPhone || null;
    if (typeof isHotRaw === 'boolean') patch.is_hot = isHotRaw;

    if (status) {
      const allowedStatuses = [
        'new',
        'in_progress',
        'production',
        'completed',
        'cancelled',
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Недопустимый статус' });
      }
      patch.status = status;
    }

    if (deadlineAtRaw) {
      const deadlineDate = new Date(deadlineAtRaw);
      if (Number.isNaN(deadlineDate.getTime())) {
        return res
          .status(400)
          .json({ message: 'Некорректный формат дедлайна' });
      }
      const iso = deadlineDate.toISOString();
      patch.deadline_at = iso;
      patch.deadline = iso;
    }

    if (sumTotalRaw != null) {
      const sum = Number(sumTotalRaw) || 0;
      patch.sum_total = sum;
      patch.total_amount = sum;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    await knex('orders').where({ id }).update(patch);

    const updated = await knex('orders as o')
      .leftJoin('users as u', 'o.manager_id', 'u.id')
      .select('o.*', 'u.name as manager_name')
      .where('o.id', id)
      .first();

    return res.json(mapOrderRow(updated));
  } catch (err) {
    return next(err);
  }
});

// PUT /api/orders/:id/status — смена статуса (с проверкой прав)
app.put('/api/orders/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ message: 'Статус обязателен' });
    }

    const allowedStatuses = [
      'new',
      'in_progress',
      'production',
      'completed',
      'cancelled',
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус' });
    }

    const row = await knex('orders').where({ id }).first();
    if (!row) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (!canEditOrder(row, req.user)) {
      return res
        .status(403)
        .json({ message: 'У вас нет прав изменять статус этого заказа' });
    }

    await knex('orders').where({ id }).update({ status });

    const updated = await knex('orders as o')
      .leftJoin('users as u', 'o.manager_id', 'u.id')
      .select('o.*', 'u.name as manager_name')
      .where('o.id', id)
      .first();

    return res.json(mapOrderRow(updated));
  } catch (err) {
    return next(err);
  }
});

// 404 — JSON по умолчанию
app.use((req, res, next) => {
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
