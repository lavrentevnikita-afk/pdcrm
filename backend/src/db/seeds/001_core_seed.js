exports.seed = async function seed(knex) {
  const crypto = require('crypto');

  const hashCode = (code) =>
    crypto.createHash('sha256').update(String(code)).digest('hex');

  // Очищаем данные в корректном порядке
  await knex('orders').del();
  await knex('product_price_tiers').del().catch(() => {});
  await knex('products').del();
  await knex('product_categories').del().catch(() => {});
  await knex('clients').del();
  await knex('users').del();

  // --- Пользователи (демо-доступы) ---
  const users = [
    { id: 1, name: 'Евгений', role: 'director', access_code_hash: hashCode('1001'), is_active: 1 },
    { id: 2, name: 'Андрей', role: 'admin', access_code_hash: hashCode('1002'), is_active: 1 },
    { id: 3, name: 'Александр', role: 'manager', access_code_hash: hashCode('2001'), is_active: 1 },
    { id: 4, name: 'Мария', role: 'manager', access_code_hash: hashCode('2002'), is_active: 1 },
    { id: 5, name: 'Игорь', role: 'production', access_code_hash: hashCode('3001'), is_active: 1 },
  ];

  await knex('users').insert(users);

  // --- Клиенты ---
  const clients = [
    {
      id: 1,
      full_name: 'Иван Иванов',
      phone: '+7 999 111-11-11',
      email: 'ivan@example.com',
      organization_name: 'ООО «Ромашка»',
      comment: 'Постоянный клиент, любит срочные заказы.',
    },
    {
      id: 2,
      full_name: 'Петров Сергей',
      phone: '+7 999 222-22-22',
      email: 'petrov@example.com',
      organization_name: 'ИП Петров',
      comment: 'Нужна аккуратная упаковка.',
    },
    {
      id: 3,
      full_name: 'ООО «МаркетМедиа»',
      phone: '+7 999 333-33-33',
      email: 'office@marketmedia.ru',
      organization_name: 'ООО «МаркетМедиа»',
      comment: 'Рекламное агентство, большие тиражи.',
    },
  ];

  await knex('clients').insert(clients);

  // --- Категории продукции ---
  const categories = [
    { id: 1, name: 'Полиграфия', slug: 'print' },
    { id: 2, name: 'Текстиль', slug: 'textile' },
    { id: 3, name: 'Сувениры', slug: 'souvenirs' },
  ];

  await knex('product_categories').insert(categories);

  // --- Продукция ---
  const products = [
    {
      id: 1,
      name: 'Визитки 90×50, 300 г/м²',
      category_id: 1,
      base_price: 500, // базовая цена за минимальный тираж
      comment: 'Цветная печать, односторонняя.',
    },
    {
      id: 2,
      name: 'Листовки A5, 130 г/м²',
      category_id: 1,
      base_price: 1500,
      comment: 'Цветная печать, двусторонняя.',
    },
    {
      id: 3,
      name: 'Футболка с логотипом',
      category_id: 2,
      base_price: 1200,
      comment: 'Базовая модель, печать спереди.',
    },
    {
      id: 4,
      name: 'Кружка с логотипом',
      category_id: 3,
      base_price: 800,
      comment: 'Керамическая кружка в фирменной коробке.',
    },
  ];

  await knex('products').insert(products);

  // --- Ценовые диапазоны (product_price_tiers) ---
  const tiers = [
    // Визитки
    {
      product_id: 1,
      min_qty: 100,
      max_qty: 500,
      price_per_unit: 5,
      discount_percent: null,
    },
    {
      product_id: 1,
      min_qty: 501,
      max_qty: 1000,
      price_per_unit: 4,
      discount_percent: null,
    },
    // Футболки
    {
      product_id: 3,
      min_qty: 1,
      max_qty: 10,
      price_per_unit: null,
      discount_percent: 0,
    },
    {
      product_id: 3,
      min_qty: 11,
      max_qty: null,
      price_per_unit: null,
      discount_percent: 15,
    },
  ];

  await knex('product_price_tiers').insert(tiers).catch(() => {});

  // --- Заказы ---
  const now = new Date();

  const orders = [
    {
      id: 1,
      client_id: 1,
      manager_id: 3,
      status: 'new',
      total_amount: 3500,
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Новый заказ на визитки и листовки. Срочно к понедельнику.',
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      client_id: 2,
      manager_id: 4,
      status: 'in_progress',
      total_amount: 12000,
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Партия футболок для персонала магазина.',
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      client_id: 3,
      manager_id: 3,
      status: 'done',
      total_amount: 25000,
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Серия сувенирной продукции с логотипом для конференции.',
      created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      client_id: 2,
      manager_id: 4,
      status: 'cancelled',
      total_amount: 0,
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Отменённый заказ, клиент перенёс мероприятие.',
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  await knex('orders').insert(orders);
};
