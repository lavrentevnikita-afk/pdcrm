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

const { calculateOrderItemPrice, recalculateOrderTotals } = require('./orders.service');

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

  const paidAmount = Number(row.paid_amount || 0);
  const remainingAmount = Math.max(0, Number(sum) - paidAmount);

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
    paid_amount: paidAmount,
    payment_status: row.payment_status || 'unpaid',
    remaining_amount: remainingAmount,
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
      items: rawItems,
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
    const initialSum = Number(sumTotalRaw) || 0;

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

    const [insertedId] = await knex('orders').insert({
      order_number: orderNumber,
      title,
      client_name: clientName || null,
      client_phone: clientPhone || null,
      manager_id: req.user.id,
      status: status || 'new',
      deadline_at: deadlineIso,
      deadline: deadlineIso,
      sum_total: initialSum,
      total_amount: initialSum,
      is_hot: !!isHotRaw,
    });

    // Если переданы позиции заказа — сохраняем их и пересчитываем сумму
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      for (const rawItem of rawItems) {
        const quantity = Number(rawItem.quantity) || 0;
        if (!quantity) continue;

        const productId =
          rawItem.product_id != null ? Number(rawItem.product_id) : null;

        let basePrice = Number(rawItem.base_price) || 0;
        let unitPrice = Number(rawItem.unit_price) || 0;
        let discountPercent = Number(rawItem.discount_percent) || 0;
        let discountValue = Number(rawItem.discount_value) || 0;
        let totalPrice = Number(rawItem.total_price) || 0;

        // Если цена не передана с фронта — рассчитываем по тиражу и прайсу
        if ((!unitPrice || !totalPrice) && productId && quantity > 0) {
          const pricing = await calculateOrderItemPrice(
            knex,
            productId,
            quantity
          );
          basePrice = pricing.basePrice;
          unitPrice = pricing.unitPrice;

          const lineBase = unitPrice * quantity;
          if (!discountValue && discountPercent) {
            discountValue = (lineBase * discountPercent) / 100;
          }
          totalPrice = totalPrice || lineBase - discountValue;
        }

        const productName =
          rawItem.product_name ||
          rawItem.productName ||
          'Позиция заказа';

        await knex('order_items').insert({
          order_id: insertedId,
          product_id: productId,
          product_name: productName,
          quantity,
          unit: rawItem.unit || 'шт.',
          base_price: basePrice,
          unit_price: unitPrice,
          discount_percent: discountPercent,
          discount_value: discountValue,
          total_price: totalPrice,
          comment: rawItem.comment || null,
        });
      }

      // Пересчёт итогов по заказу на основе позиций
      await recalculateOrderTotals(knex, insertedId);
    }

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

// GET /api/product-categories — список категорий продукции
app.get('/api/product-categories', authMiddleware, async (req, res, next) => {
  try {
    const categories = await knex('product_categories')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');

    res.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sort_order: c.sort_order,
      }))
    );
  } catch (err) {
    return next(err);
  }
});

// GET /api/products — список продукции с фильтрами по категории и поиску
app.get('/api/products', authMiddleware, async (req, res, next) => {
  try {
    const { category_id: categoryId, search } = req.query;

    let query = knex('products as p')
      .leftJoin('product_categories as c', 'p.category_id', 'c.id')
      .where('p.is_active', 1);

    if (categoryId) {
      query = query.andWhere('p.category_id', Number(categoryId));
    }

    if (search) {
      const like = `%${search.trim()}%`;
      query = query.andWhere((qb) => {
        qb.where('p.name', 'like', like).orWhere('p.comment', 'like', like);
      });
    }

    const rows = await query
      .select(
        'p.id',
        'p.name',
        'p.category_id',
        'p.base_price',
        'p.unit',
        'p.comment',
        'c.name as category_name'
      )
      .orderBy('c.sort_order', 'asc')
      .orderBy('p.name', 'asc');

    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        category_id: row.category_id,
        category_name: row.category_name,
        base_price: Number(row.base_price || 0),
        unit: row.unit,
        comment: row.comment,
      }))
    );
  } catch (err) {
    return next(err);
  }
});

// GET /api/products/:id — карточка товара
app.get('/api/products/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await knex('products as p')
      .leftJoin('product_categories as c', 'p.category_id', 'c.id')
      .where('p.id', Number(id))
      .first(
        'p.id',
        'p.name',
        'p.category_id',
        'p.base_price',
        'p.unit',
        'p.comment',
        'p.is_active',
        'c.name as category_name'
      );

    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({
      id: product.id,
      name: product.name,
      category_id: product.category_id,
      category_name: product.category_name,
      base_price: Number(product.base_price || 0),
      unit: product.unit,
      comment: product.comment,
      is_active: !!product.is_active,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/products/:id/price-tiers — ценовые уровни по тиражам
app.get(
  '/api/products/:id/price-tiers',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const product = await knex('products').where({ id: Number(id) }).first();
      if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      const tiers = await knex('product_price_tiers')
        .where({ product_id: Number(id) })
        .orderBy('min_qty', 'asc');

      res.json(
        tiers.map((t) => ({
          id: t.id,
          product_id: t.product_id,
          min_qty: t.min_qty,
          max_qty: t.max_qty,
          price_per_unit:
            t.price_per_unit != null ? Number(t.price_per_unit) : null,
          discount_percent:
            t.discount_percent != null ? Number(t.discount_percent) : null,
        }))
      );
    } catch (err) {
      return next(err);
    }
  }
);

// Helper to check admin/director rights for справочники
function ensureCanManageCatalog(req, res) {
  const user = req.user || {};
  const allowedRoles = ['admin', 'director'];

  if (!allowedRoles.includes(user.role)) {
    return res
      .status(403)
      .json({ message: 'Недостаточно прав для изменения справочников' });
  }

  return null;
}

// POST /api/products — создание товара (админ/директор)
app.post('/api/products', authMiddleware, async (req, res, next) => {
  try {
    const roleError = ensureCanManageCatalog(req, res);
    if (roleError) return roleError;

    const { name, category_id: categoryId, base_price, unit, comment } =
      req.body || {};

    if (!name) {
      return res.status(400).json({ message: 'Название обязательно' });
    }

    const [id] = await knex('products').insert(
      {
        name,
        category_id: categoryId || null,
        base_price: base_price || 0,
        unit: unit || 'шт.',
        comment: comment || null,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ['id']
    );

    const productId = typeof id === 'object' && id.id ? id.id : id;

    const created = await knex('products').where({ id: productId }).first();

    res.status(201).json(created);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/products/:id — обновление товара (админ/директор)
app.put('/api/products/:id', authMiddleware, async (req, res, next) => {
  try {
    const roleError = ensureCanManageCatalog(req, res);
    if (roleError) return roleError;

    const { id } = req.params;
    const { name, category_id: categoryId, base_price, unit, comment, is_active } =
      req.body || {};

    const existing = await knex('products')
      .where({ id: Number(id) })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    await knex('products')
      .where({ id: Number(id) })
      .update({
        name: name != null ? name : existing.name,
        category_id:
          categoryId !== undefined ? categoryId || null : existing.category_id,
        base_price:
          base_price !== undefined ? base_price : existing.base_price,
        unit: unit != null ? unit : existing.unit,
        comment: comment !== undefined ? comment : existing.comment,
        is_active:
          is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        updated_at: new Date().toISOString(),
      });

    const updated = await knex('products').where({ id: Number(id) }).first();

    res.json(updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/products/:id — удаление товара (админ/директор)
app.delete('/api/products/:id', authMiddleware, async (req, res, next) => {
  try {
    const roleError = ensureCanManageCatalog(req, res);
    if (roleError) return roleError;

    const { id } = req.params;

    const existing = await knex('products')
      .where({ id: Number(id) })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    await knex('products').where({ id: Number(id) }).del();

    res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// GET /api/cash/orders — неоплаченные и частично оплаченные заказы
app.get('/api/cash/orders', authMiddleware, async (req, res, next) => {
  try {
    const {
      client_phone: clientPhone,
      date_from: dateFrom,
      date_to: dateTo,
      payment_status: paymentStatus,
    } = req.query;

    let query = knex('orders as o').leftJoin('users as u', 'o.manager_id', 'u.id');

    // Исключаем отменённые заказы
    query = query.whereNot('o.status', 'cancelled');

    // Фильтр по статусу оплаты
    if (paymentStatus) {
      const statuses = Array.isArray(paymentStatus)
        ? paymentStatus
        : String(paymentStatus)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      if (statuses.length > 0) {
        query = query.whereIn('o.payment_status', statuses);
      }
    } else {
      // По умолчанию — только неоплаченные и частично оплаченные
      query = query.whereIn('o.payment_status', ['unpaid', 'partial']);
    }

    // Фильтр по телефону клиента
    if (clientPhone && clientPhone.trim()) {
      const like = `%${clientPhone.trim()}%`;
      query = query.andWhere('o.client_phone', 'like', like);
    }

    // Фильтр по дате исполнения (дедлайну)
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        query = query.andWhere('o.deadline_at', '>=', from.toISOString());
      }
    }

    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        query = query.andWhere('o.deadline_at', '<=', to.toISOString());
      }
    }

    const rows = await query
      .select('o.*', 'u.name as manager_name')
      .orderBy('o.deadline_at', 'asc')
      .orderBy('o.id', 'desc');

    const items = rows.map(mapOrderRow);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

// POST /api/payments — провести оплату
app.post('/api/payments', authMiddleware, async (req, res, next) => {
  try {
    const { order_id: orderId, amount, method } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ message: 'order_id обязателен' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ message: 'Сумма оплаты должна быть положительным числом' });
    }

    if (!method || typeof method !== 'string') {
      return res.status(400).json({ message: 'Способ оплаты обязателен' });
    }

    const order = await knex('orders').where({ id: orderId }).first();
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const total =
      order.sum_total != null
        ? Number(order.sum_total)
        : Number(order.total_amount || 0);

    const currentPaid = Number(order.paid_amount || 0);
    const newPaid = currentPaid + numericAmount;

    if (total > 0 && newPaid - total > 0.01) {
      return res
        .status(400)
        .json({ message: 'Сумма оплаты превышает остаток по заказу' });
    }

    let paymentStatus = 'unpaid';
    if (newPaid <= 0.01) {
      paymentStatus = 'unpaid';
    } else if (total > 0 && newPaid + 0.01 >= total) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'partial';
    }

    const now = new Date().toISOString();

    await knex.transaction(async (trx) => {
      const [paymentId] = await trx('payments').insert({
        order_id: order.id,
        amount: numericAmount,
        method,
        paid_at: now,
        created_by: req.user.id,
        created_at: now,
        updated_at: now,
      });

      await trx('orders')
        .where({ id: order.id })
        .update({
          paid_amount: newPaid,
          payment_status: paymentStatus,
          updated_at: now,
        });

      // Обновим текущую кассовую смену, если она открыта
      const currentShift = await trx('cash_shifts')
        .whereNull('closed_at')
        .orderBy('opened_at', 'desc')
        .first();

      if (currentShift) {
        await trx('cash_shifts')
          .where({ id: currentShift.id })
          .update({
            total_amount: Number(currentShift.total_amount || 0) + numericAmount,
            updated_at: now,
          });
      }

      const payment = await trx('payments').where({ id: paymentId }).first();

      return res.status(201).json({
        payment,
        order: {
          ...order,
          paid_amount: newPaid,
          payment_status: paymentStatus,
        },
      });
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/cash/shift/current — текущая кассовая смена
app.get('/api/cash/shift/current', authMiddleware, async (req, res, next) => {
  try {
    const shift = await knex('cash_shifts')
      .whereNull('closed_at')
      .orderBy('opened_at', 'desc')
      .first();

    if (!shift) {
      return res.json({ shift: null });
    }

    return res.json({ shift });
  } catch (err) {
    return next(err);
  }
});

// POST /api/cash/shift/open — открыть кассовую смену
app.post('/api/cash/shift/open', authMiddleware, async (req, res, next) => {
  try {
    const existing = await knex('cash_shifts')
      .whereNull('closed_at')
      .first();

    if (existing) {
      return res
        .status(400)
        .json({ message: 'Уже есть открытая кассовая смена' });
    }

    const now = new Date().toISOString();

    const [id] = await knex('cash_shifts').insert({
      opened_at: now,
      opened_by: req.user.id,
      total_amount: 0,
      created_at: now,
      updated_at: now,
    });

    const shift = await knex('cash_shifts').where({ id }).first();

    return res.status(201).json({ shift });
  } catch (err) {
    return next(err);
  }
});

// POST /api/cash/shift/close — закрыть кассовую смену
app.post('/api/cash/shift/close', authMiddleware, async (req, res, next) => {
  try {
    const shift = await knex('cash_shifts')
      .whereNull('closed_at')
      .orderBy('opened_at', 'desc')
      .first();

    if (!shift) {
      return res
        .status(400)
        .json({ message: 'Нет открытой кассовой смены для закрытия' });
    }

    const now = new Date().toISOString();

    await knex('cash_shifts')
      .where({ id: shift.id })
      .update({
        closed_at: now,
        closed_by: req.user.id,
        updated_at: now,
      });

    const updated = await knex('cash_shifts').where({ id: shift.id }).first();

    return res.json({ shift: updated });
  } catch (err) {
    return next(err);
  }
});

// 404 handler (must be after all routes)
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
