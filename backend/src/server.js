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

// Demo in-memory datasets for phase 7 modules
const warehouseItems = [
  {
    id: 1,
    name: 'Мелованная бумага 300 г/м²',
    unit: 'лист',
    stock: 850,
    reorder_level: 300,
    supplier: 'Поставщик А',
    last_movement_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Бумага офисная A4',
    unit: 'пачка',
    stock: 42,
    reorder_level: 40,
    supplier: 'БумагаПро',
    last_movement_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Баннерная ткань 440 г/м²',
    unit: 'м²',
    stock: 120,
    reorder_level: 80,
    supplier: 'Outdoor Print',
    last_movement_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Пластик ПВХ 3 мм',
    unit: 'лист',
    stock: 25,
    reorder_level: 30,
    supplier: 'ПластМаркет',
    last_movement_at: new Date().toISOString(),
  },
];

const warehouseMovements = [
  {
    id: 1,
    item_id: 1,
    type: 'out',
    quantity: 50,
    note: 'Тираж визиток',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    item_id: 2,
    type: 'in',
    quantity: 20,
    note: 'Поставка от БумагаПро',
    created_at: new Date().toISOString(),
  },
];

const purchaseRequests = [
  {
    id: 1,
    material: 'Пластик ПВХ 3 мм',
    quantity: 50,
    status: 'pending',
    requested_by: 'Анна Шахова',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    material: 'Баннерная ткань 440 г/м²',
    quantity: 100,
    status: 'approved',
    requested_by: 'Дмитрий Павлов',
    created_at: new Date().toISOString(),
  },
];

const staffMembers = [
  {
    id: 1,
    name: 'Анна Шахова',
    role: 'Дизайнер',
    department: 'Дизайн',
    phone: '+7 999 123-45-67',
    email: 'anna@pdcrm.local',
    workload: 4,
  },
  {
    id: 2,
    name: 'Дмитрий Павлов',
    role: 'Производство',
    department: 'Цех',
    phone: '+7 912 555-33-22',
    email: 'd.pavlov@pdcrm.local',
    workload: 7,
  },
  {
    id: 3,
    name: 'Мария Белова',
    role: 'Менеджер',
    department: 'Отдел продаж',
    phone: '+7 921 777-11-00',
    email: 'm.belova@pdcrm.local',
    workload: 3,
  },
];

const permissionMatrix = [
  {
    id: 1,
    name: 'Анна Шахова',
    role: 'designer',
    permissions: {
      orders: true,
      production: false,
      cashbox: false,
      analytics: true,
      warehouse: true,
    },
  },
  {
    id: 2,
    name: 'Дмитрий Павлов',
    role: 'production',
    permissions: {
      orders: true,
      production: true,
      cashbox: false,
      analytics: false,
      warehouse: true,
    },
  },
  {
    id: 3,
    name: 'Мария Белова',
    role: 'manager',
    permissions: {
      orders: true,
      production: false,
      cashbox: true,
      analytics: true,
      warehouse: false,
    },
  },
];

const notificationFeed = [
  {
    id: 1,
    title: 'Новый заказ #2405',
    message: 'Поступил запрос на 500 листовок. Срок — 2 дня.',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Низкий остаток: Пластик ПВХ 3 мм',
    message: 'Остаток 25 листов, требуется докупить.',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Оплата по заказу #2330',
    message: 'Поступила частичная оплата 18 500 ₽.',
    is_read: true,
    created_at: new Date().toISOString(),
  },
];

const DIRECTORY_TYPES = new Set([
  'users',
  'productCategories',
  'products',
  'clients',
  'organizations',
  'materials',
  'materialCategories',
  'suppliers',
  'cashShifts',
  'postpress',
  'techCards',
  'equipment',
  'productionStages',
  'pricingFormulas',
  'clientSources',
  'staffRoles',
]);

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

const ORDER_STATUSES = new Set(['new', 'in_progress', 'done', 'canceled']);

function normalizeStatus(value) {
  if (value === 'completed') return 'done';
  if (value === 'cancelled') return 'canceled';
  if (value && ORDER_STATUSES.has(value)) return value;
  return 'new';
}

function parseClientData(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function mapOrder(row, items = [], clientData) {
  if (!row) return null;

  const client = clientData || parseClientData(row.client_data);

  return {
    id: row.id,
    client_id: row.client_id || null,
    client: client && row.client_id
      ? {
          id: row.client_id,
          ...client,
        }
      : null,
    status: normalizeStatus(row.status),
    total_amount: Number(row.total_amount || 0),
    deadline: row.deadline,
    comment: row.comment || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: items.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id || null,
      name: item.name,
      qty: Number(item.qty),
      price: Number(item.price),
      line_total: Number(item.line_total),
    })),
  };
}

// GET /api/orders — список заказов
app.get('/api/orders', authMiddleware, async (req, res, next) => {
  try {
    const rows = await knex('orders as o')
      .leftJoin('directories as c', function () {
        this.on('o.client_id', '=', 'c.id').andOn(
          'c.type',
          '=',
          knex.raw('?', ['clients'])
        );
      })
      .select('o.*', 'c.data as client_data')
      .orderBy('o.created_at', 'desc');

    return res.json({ items: rows.map((row) => mapOrder(row)) });
  } catch (err) {
    return next(err);
  }
});

// GET /api/orders/:id — карточка заказа
app.get('/api/orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await knex('orders as o')
      .leftJoin('directories as c', function () {
        this.on('o.client_id', '=', 'c.id').andOn(
          'c.type',
          '=',
          knex.raw('?', ['clients'])
        );
      })
      .select('o.*', 'c.data as client_data')
      .where('o.id', id)
      .first();

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const items = await knex('order_items').where({ order_id: id });
    return res.json(mapOrder(order, items));
  } catch (err) {
    return next(err);
  }
});

function recalcTotals(items = []) {
  const normalized = [];
  let total = 0;

  for (const item of items) {
    if (!item || !item.name) continue;
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const lineTotal = qty * price;
    total += lineTotal;
    normalized.push({
      product_id: item.product_id || null,
      name: item.name,
      qty,
      price,
      line_total: lineTotal,
    });
  }

  return { total, normalizedItems: normalized };
}

// POST /api/orders — создать заказ
app.post('/api/orders', authMiddleware, async (req, res, next) => {
  const trx = await knex.transaction();
  try {
    const { client_id: clientId, status, deadline, comment, items = [] } =
      req.body || {};

    const { total, normalizedItems } = recalcTotals(items);
    const normalizedStatus = normalizeStatus(status);

    const [orderId] = await trx('orders').insert({
      client_id: clientId || null,
      status: normalizedStatus,
      deadline: deadline || null,
      comment: comment || '',
      total_amount: total,
    });

    for (const item of normalizedItems) {
      await trx('order_items').insert({
        order_id: orderId,
        ...item,
      });
    }

    await trx.commit();

    const created = await knex('orders as o')
      .leftJoin('directories as c', function () {
        this.on('o.client_id', '=', 'c.id').andOn(
          'c.type',
          '=',
          knex.raw('?', ['clients'])
        );
      })
      .select('o.*', 'c.data as client_data')
      .where('o.id', orderId)
      .first();
    const createdItems = await knex('order_items').where({ order_id: orderId });
    return res.status(201).json(mapOrder(created, createdItems));
  } catch (err) {
    await trx.rollback();
    return next(err);
  }
});

// PUT/PATCH /api/orders/:id — изменить заказ
app.put('/api/orders/:id', authMiddleware, async (req, res, next) => {
  const trx = await knex.transaction();
  try {
    const { id } = req.params;
    const { client_id: clientId, status, deadline, comment, items = [] } =
      req.body || {};

    const existing = await trx('orders').where({ id }).first();
    if (!existing) {
      await trx.rollback();
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const { total, normalizedItems } = recalcTotals(items);

    await trx('orders')
      .where({ id })
      .update({
        client_id: clientId === undefined ? existing.client_id : clientId,
        status: normalizeStatus(status ?? existing.status),
        deadline: deadline === undefined ? existing.deadline : deadline,
        comment: comment === undefined ? existing.comment : comment,
        total_amount: total,
        updated_at: new Date().toISOString(),
      });

    await trx('order_items').where({ order_id: id }).del();
    for (const item of normalizedItems) {
      await trx('order_items').insert({
        order_id: id,
        ...item,
      });
    }

    await trx.commit();

    const updated = await knex('orders as o')
      .leftJoin('directories as c', function () {
        this.on('o.client_id', '=', 'c.id').andOn(
          'c.type',
          '=',
          knex.raw('?', ['clients'])
        );
      })
      .select('o.*', 'c.data as client_data')
      .where('o.id', id)
      .first();
    const updatedItems = await knex('order_items').where({ order_id: id });
    return res.json(mapOrder(updated, updatedItems));
  } catch (err) {
    await trx.rollback();
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

// ===============================
// Directories storage (generic)
// ===============================
function ensureDirectoryType(type) {
  if (!DIRECTORY_TYPES.has(type)) {
    const error = new Error('Неизвестный тип справочника');
    error.status = 400;
    throw error;
  }
}

app.get('/api/directories/:type', authMiddleware, async (req, res, next) => {
  try {
    const { type } = req.params;
    ensureDirectoryType(type);

    const rows = await knex('directories').where({ type }).orderBy('id', 'asc');

    const items = rows.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ...(row.data ? JSON.parse(row.data) : {}),
    }));

    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/directories/:type/export', authMiddleware, async (req, res, next) => {
  try {
    const { type } = req.params;
    ensureDirectoryType(type);

    const rows = await knex('directories').where({ type }).orderBy('id', 'asc');

    const items = rows.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ...(row.data ? JSON.parse(row.data) : {}),
    }));

    res.setHeader('Content-Disposition', `attachment; filename="${type}-directories.json"`);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/directories/:type/import', authMiddleware, async (req, res, next) => {
  try {
    const { type } = req.params;
    ensureDirectoryType(type);

    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Ожидается список записей для импорта' });
    }

    const now = new Date().toISOString();

    await knex.transaction(async (trx) => {
      for (const entry of items) {
        const source = entry || {};
        const { id, created_at, updated_at, ...data } = source;
        const createdAt = created_at || now;
        const updatedAt = updated_at || createdAt;

        await trx('directories').insert({
          type,
          data: JSON.stringify(data || {}),
          created_at: createdAt,
          updated_at: updatedAt,
        });
      }
    });

    return res.status(201).json({ inserted: items.length });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/directories/:type', authMiddleware, async (req, res, next) => {
  try {
    const { type } = req.params;
    ensureDirectoryType(type);

    const payload = req.body || {};
    const now = new Date().toISOString();

    const [id] = await knex('directories').insert({
      type,
      data: JSON.stringify(payload),
      created_at: now,
      updated_at: now,
    });

    const created = await knex('directories').where({ id }).first();

    return res.status(201).json({
      id: created.id,
      created_at: created.created_at,
      updated_at: created.updated_at,
      ...(created.data ? JSON.parse(created.data) : {}),
    });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/directories/:type/:id', authMiddleware, async (req, res, next) => {
  try {
    const { type, id } = req.params;
    ensureDirectoryType(type);

    const existing = await knex('directories').where({ id: Number(id), type }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    const payload = req.body || {};
    const now = new Date().toISOString();

    await knex('directories')
      .where({ id: Number(id), type })
      .update({ data: JSON.stringify(payload), updated_at: now });

    const updated = await knex('directories').where({ id: Number(id) }).first();

    return res.json({
      id: updated.id,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      ...(updated.data ? JSON.parse(updated.data) : {}),
    });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/directories/:type/:id', authMiddleware, async (req, res, next) => {
  try {
    const { type, id } = req.params;
    ensureDirectoryType(type);

    const existing = await knex('directories').where({ id: Number(id), type }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    await knex('directories').where({ id: Number(id), type }).del();
    return res.status(204).send();
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

// ===============================
// Phase 7: Warehouse & Purchase
// ===============================
app.get('/api/warehouse/items', authMiddleware, (req, res) => {
  const enriched = warehouseItems.map((item) => ({
    ...item,
    low_stock: item.stock <= item.reorder_level,
  }));
  res.json({ items: enriched });
});

app.post('/api/warehouse/items', authMiddleware, (req, res) => {
  const { name, unit, stock, reorder_level, supplier } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: 'Название материала обязательно' });
  }

  const nextId = Math.max(...warehouseItems.map((i) => i.id)) + 1;
  const newItem = {
    id: nextId,
    name,
    unit: unit || 'шт',
    stock: Number(stock) || 0,
    reorder_level: Number(reorder_level) || 0,
    supplier: supplier || '—',
    last_movement_at: new Date().toISOString(),
  };

  warehouseItems.push(newItem);
  return res.status(201).json({ item: newItem });
});

app.post('/api/warehouse/movements', authMiddleware, (req, res) => {
  const { item_id, type, quantity, note } = req.body || {};
  const item = warehouseItems.find((i) => i.id === Number(item_id));

  if (!item) {
    return res.status(404).json({ message: 'Материал не найден' });
  }
  if (!['in', 'out'].includes(type)) {
    return res.status(400).json({ message: 'Неверный тип движения' });
  }
  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Количество должно быть больше нуля' });
  }

  if (type === 'out' && item.stock - qty < 0) {
    return res.status(400).json({ message: 'Недостаточно остатка' });
  }

  item.stock += type === 'in' ? qty : -qty;
  item.last_movement_at = new Date().toISOString();

  const nextId = warehouseMovements.length
    ? Math.max(...warehouseMovements.map((m) => m.id)) + 1
    : 1;
  const movement = {
    id: nextId,
    item_id: item.id,
    type,
    quantity: qty,
    note: note || '',
    created_at: new Date().toISOString(),
  };
  warehouseMovements.push(movement);

  return res.status(201).json({ item, movement });
});

app.get('/api/warehouse/purchase-requests', authMiddleware, (req, res) => {
  res.json({ requests: purchaseRequests });
});

app.post('/api/warehouse/purchase-requests', authMiddleware, (req, res) => {
  const { material, quantity } = req.body || {};
  if (!material) {
    return res.status(400).json({ message: 'Материал обязателен' });
  }
  const nextId = purchaseRequests.length
    ? Math.max(...purchaseRequests.map((r) => r.id)) + 1
    : 1;
  const request = {
    id: nextId,
    material,
    quantity: Number(quantity) || 0,
    status: 'pending',
    requested_by: req.user?.name || 'Неизвестно',
    created_at: new Date().toISOString(),
  };
  purchaseRequests.push(request);
  return res.status(201).json({ request });
});

// ===============================
// Phase 7: Staff
// ===============================
app.get('/api/staff', authMiddleware, (req, res) => {
  res.json({ staff: staffMembers });
});

// ===============================
// Phase 7: Analytics
// ===============================
app.get('/api/analytics/revenue', authMiddleware, (req, res) => {
  const points = [
    { label: 'Пн', value: 320000 },
    { label: 'Вт', value: 280000 },
    { label: 'Ср', value: 360000 },
    { label: 'Чт', value: 410000 },
    { label: 'Пт', value: 390000 },
    { label: 'Сб', value: 275000 },
    { label: 'Вс', value: 190000 },
  ];
  res.json({
    period: 'week',
    total: points.reduce((sum, p) => sum + p.value, 0),
    change: 8.4,
    points,
  });
});

app.get('/api/analytics/top-products', authMiddleware, (req, res) => {
  res.json({
    products: [
      { name: 'Листовки А5', revenue: 520000, share: 32 },
      { name: 'Буклеты трёхсложные', revenue: 310000, share: 19 },
      { name: 'Баннер 3х6', revenue: 240000, share: 15 },
      { name: 'Визитки премиум', revenue: 190000, share: 12 },
      { name: 'Наклейки круг 50 мм', revenue: 150000, share: 9 },
    ],
  });
});

app.get('/api/analytics/top-clients', authMiddleware, (req, res) => {
  res.json({
    clients: [
      { name: 'ООО «СеверСтрой»', revenue: 420000, orders: 18 },
      { name: 'ИП Панкратов', revenue: 310000, orders: 12 },
      { name: 'Coffee&Co', revenue: 270000, orders: 9 },
      { name: 'Театр света', revenue: 230000, orders: 7 },
    ],
  });
});

// ===============================
// Phase 7: Permissions
// ===============================
app.get('/api/permissions/users', authMiddleware, (req, res) => {
  res.json({ users: permissionMatrix });
});

app.post('/api/permissions/:userId', authMiddleware, (req, res) => {
  const { userId } = req.params;
  const entry = permissionMatrix.find((u) => u.id === Number(userId));
  if (!entry) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  entry.permissions = {
    ...entry.permissions,
    ...(req.body?.permissions || {}),
  };
  res.json({ user: entry });
});

// ===============================
// Phase 7: Notifications
// ===============================
app.get('/api/notifications', authMiddleware, (req, res) => {
  res.json({ notifications: notificationFeed });
});

app.post('/api/notifications/mark-read', authMiddleware, (req, res) => {
  const { id } = req.body || {};
  if (id) {
    const target = notificationFeed.find((n) => n.id === Number(id));
    if (target) {
      target.is_read = true;
    }
  } else {
    notificationFeed.forEach((n) => {
      n.is_read = true;
    });
  }

  res.json({ notifications: notificationFeed });
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
