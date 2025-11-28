exports.seed = async function seed(knex) {
  const crypto = require('crypto');

  // Clear existing data
  await knex('orders').del();
  await knex('products').del();
  await knex('clients').del();
  await knex('users').del();

  const hashCode = (code) =>
    crypto.createHash('sha256').update(String(code)).digest('hex');

  const users = [
    { name: 'Евгений', role: 'director', access_code_hash: hashCode('1001') },
    { name: 'Андрей', role: 'admin', access_code_hash: hashCode('1002') },
    { name: 'Александр', role: 'designer', access_code_hash: hashCode('2001') },
    { name: 'Анастасия', role: 'designer', access_code_hash: hashCode('2002') },
    { name: 'Валентина', role: 'designer', access_code_hash: hashCode('2003') },
    { name: 'Юлия', role: 'designer', access_code_hash: hashCode('2004') },
    { name: 'Ольга', role: 'designer', access_code_hash: hashCode('2005') },
    { name: 'Никита', role: 'production', access_code_hash: hashCode('3001') },
    { name: 'Виктор', role: 'production', access_code_hash: hashCode('3002') },
    { name: 'Павел', role: 'production', access_code_hash: hashCode('3003') },
    { name: 'Екатерина', role: 'production', access_code_hash: hashCode('3004') },
  ];

  await knex('users').insert(users);

  // Insert clients
  const clients = [
    {
      full_name: 'Иван Иванов',
      phone: '+79990000001',
      email: 'ivanov@example.com',
      organization_name: 'ООО «ПринтСервис»',
      comment: 'Постоянный клиент, любит оперативные тиражи.',
    },
    {
      full_name: 'Петр Петров',
      phone: '+79990000002',
      email: 'petrov@example.com',
      organization_name: '',
      comment: 'Розничный заказчик, небольшие тиражи.',
    },
    {
      full_name: 'Компания «ГлобалПром»',
      phone: '+79990000003',
      email: 'office@globalprom.ru',
      organization_name: 'ООО «ГлобалПром»',
      comment: 'Крупные корпоративные заказы.',
    },
  ];

  await knex('clients').insert(clients);
  const clientRows = await knex('clients').select('id').orderBy('id');
  const clientIdValues = clientRows.map((row) => row.id);

  // Insert products
  const products = [
    {
      name: 'Визитки 90x50, 4+4',
      category: 'Полиграфия',
      base_price: 500,
      comment: 'Стандартные визитки, мелованная бумага 300 г/м².',
    },
    {
      name: 'Футболка с печатью',
      category: 'Текстиль',
      base_price: 1200,
      comment: 'Белая хлопковая футболка с полноцветной печатью.',
    },
    {
      name: 'Кружка с логотипом',
      category: 'Керамика',
      base_price: 800,
      comment: 'Керамическая кружка, печать по кругу.',
    },
  ];

  await knex('products').insert(products);

  // Insert example orders
  const orders = [
    {
      client_id: clientIdValues[0],
      status: 'new',
      total_amount: 5000,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Визитки и буклеты для выставки.',
    },
    {
      client_id: clientIdValues[1],
      status: 'in_progress',
      total_amount: 1200,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Футболка на подарок.',
    },
    {
      client_id: clientIdValues[2],
      status: 'done',
      total_amount: 25000,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      comment: 'Серия сувенирной продукции с логотипом.',
    },
  ];

  await knex('orders').insert(orders);
};
