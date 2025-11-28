exports.seed = async function seed(knex) {
  // Clear existing data
  await knex('orders').del();
  await knex('products').del();
  await knex('clients').del();

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
