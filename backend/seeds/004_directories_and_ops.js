exports.seed = async function (knex) {
  await knex('notifications').del();
  await knex('warehouse_movements').del();
  await knex('warehouse_items').del();
  await knex('purchase_requests').del();
  await knex('clients').del();
  await knex('materials').del();
  await knex('suppliers').del();

  const now = new Date();

  const clients = [
    {
      name: 'ООО «Север»',
      segment: 'B2B',
      contact: 'sales@sever.ru',
      note: 'Регулярные тиражи буклетов',
    },
    {
      name: 'ИП Иванова',
      segment: 'B2C',
      contact: 'ivanova@example.com',
      note: 'Рекламные листовки',
    },
    {
      name: 'Digital Fox',
      segment: 'B2B',
      contact: 'hi@dfox.ru',
      note: 'Корпоративный мерч',
    },
  ];

  const materials = [
    {
      name: 'Мелованная бумага 170 г/м²',
      type: 'Бумага',
      unit: 'лист',
      note: 'Белая, глянец',
    },
    {
      name: 'Баннер 440 г/м²',
      type: 'Баннер',
      unit: 'м²',
      note: 'Литой, широкоформат',
    },
    {
      name: 'Ламинат 75 мкм',
      type: 'Пленка',
      unit: 'рулон',
      note: 'Матовый',
    },
  ];

  const suppliers = [
    {
      name: 'Поставка Плюс',
      status: 'Активный',
      contact: 'supply@plus.ru',
      note: 'Основной по бумаге',
    },
    {
      name: 'Графика',
      status: 'На проверке',
      contact: 'hello@grafica.ru',
      note: 'Сувенирка',
    },
  ];

  const items = [
    {
      name: 'Мелованная бумага 300 г/м²',
      unit: 'лист',
      stock: 850,
      reorder_level: 300,
      supplier: 'Поставщик А',
      last_movement_at: now,
    },
    {
      name: 'Бумага офисная A4',
      unit: 'пачка',
      stock: 42,
      reorder_level: 40,
      supplier: 'БумагаПро',
      last_movement_at: now,
    },
    {
      name: 'Баннерная ткань 440 г/м²',
      unit: 'м²',
      stock: 120,
      reorder_level: 80,
      supplier: 'Outdoor Print',
      last_movement_at: now,
    },
    {
      name: 'Пластик ПВХ 3 мм',
      unit: 'лист',
      stock: 25,
      reorder_level: 30,
      supplier: 'ПластМаркет',
      last_movement_at: now,
    },
  ];

  const [firstId] = await knex('warehouse_items').insert(items).returning('id');
  const firstItemId = firstId?.id || firstId || 1;

  const movements = [
    {
      item_id: firstItemId,
      type: 'out',
      quantity: 50,
      note: 'Тираж визиток',
      created_at: now,
    },
  ];

  const purchases = [
    {
      material: 'Пластик ПВХ 3 мм',
      quantity: 50,
      status: 'pending',
      requested_by: 'Анна Шахова',
      created_at: now,
    },
    {
      material: 'Баннерная ткань 440 г/м²',
      quantity: 100,
      status: 'approved',
      requested_by: 'Дмитрий Павлов',
      created_at: now,
    },
  ];

  const notifications = [
    {
      title: 'Новый заказ #2405',
      message: 'Поступил запрос на 500 листовок. Срок — 2 дня.',
      is_read: false,
      created_at: now,
    },
    {
      title: 'Низкий остаток: Пластик ПВХ 3 мм',
      message: 'Остаток 25 листов, требуется докупить.',
      is_read: false,
      created_at: now,
    },
    {
      title: 'Оплата по заказу #2330',
      message: 'Поступила частичная оплата 18 500 ₽.',
      is_read: true,
      created_at: now,
    },
  ];

  await knex('warehouse_movements').insert(movements);
  await knex('purchase_requests').insert(purchases);
  await knex('clients').insert(clients);
  await knex('materials').insert(materials);
  await knex('suppliers').insert(suppliers);
  await knex('notifications').insert(notifications);
};
