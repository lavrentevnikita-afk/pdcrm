/**
 * Seed reference directories with core datasets used across the app.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  const now = new Date().toISOString();

  /**
   * Helper to wipe and reinsert entries for a given directory type.
   * @param {string} type
   * @param {Array<object>} items
   */
  const resetDirectory = async (type, items) => {
    await knex('directories').where({ type }).del();

    if (!items.length) return;

    const prepared = items.map((item) => ({
      type,
      data: JSON.stringify(item),
      created_at: item.created_at || now,
      updated_at: item.updated_at || now,
    }));

    await knex('directories').insert(prepared);
  };

  await resetDirectory('clients', [
    {
      name: 'ООО «Полиграф Экспресс»',
      contact: 'Марина Пахомова',
      phone: '+7 (921) 555-12-34',
      email: 'orders@plg-exp.ru',
      city: 'Санкт-Петербург',
    },
    {
      name: 'ИП Ковалёв Константин',
      contact: 'Константин Ковалёв',
      phone: '+7 (999) 222-77-10',
      email: 'print@kovalev.pro',
      city: 'Москва',
    },
    {
      name: 'Event Group «Сфера»',
      contact: 'Светлана Власова',
      phone: '+7 (812) 444-09-18',
      email: 'svetlana@event-sfera.ru',
      city: 'Санкт-Петербург',
    },
  ]);

  await resetDirectory('materialCategories', [
    { name: 'Бумага' },
    { name: 'Пластик и ПВХ' },
    { name: 'Пленка' },
    { name: 'Краска и химия' },
  ]);

  await resetDirectory('materials', [
    {
      name: 'Мелованная бумага 170 г/м²',
      unit: 'лист',
      vendor_code: 'PAPER-170C2S',
      category: 'Бумага',
      stock: 2500,
    },
    {
      name: 'Пластик ПВХ 3 мм',
      unit: 'лист',
      vendor_code: 'PVC-3MM',
      category: 'Пластик и ПВХ',
      stock: 340,
    },
    {
      name: 'Ламинационная пленка 27 мкм',
      unit: 'рулон',
      vendor_code: 'LAM-27',
      category: 'Пленка',
      stock: 48,
    },
  ]);

  await resetDirectory('suppliers', [
    {
      name: 'ООО «СеверПечать»',
      manager: 'Екатерина Смирнова',
      phone: '+7 (812) 100-22-33',
      email: 'supply@sever-print.ru',
    },
    {
      name: 'АО «РосМатериалы»',
      manager: 'Игорь Чернов',
      phone: '+7 (495) 456-00-11',
      email: 'office@rosmaterials.ru',
    },
  ]);

  await resetDirectory('postpress', [
    { name: 'Ламинация матовая' },
    { name: 'Ламинация глянцевая' },
    { name: 'Высечка' },
    { name: 'Скрепление на скобу' },
  ]);

  await resetDirectory('techCards', [
    {
      name: 'Листовки A5, 4+4, мелованная бумага 170 г',
      operations: ['печать', 'резка', 'упаковка'],
    },
    {
      name: 'Буклет А4, фальцовка в три сгиба',
      operations: ['печать', 'фальцовка', 'упаковка'],
    },
  ]);

  await resetDirectory('equipment', [
    { name: 'Xerox Versant 280 Press', type: 'цифровая печать', location: 'Цех 1' },
    { name: 'Polar 78', type: 'резак', location: 'Цех 1' },
    { name: 'MBO K700', type: 'фальцовка', location: 'Цех 2' },
  ]);

  await resetDirectory('productionStages', [
    { name: 'Прием и проверка файлов' },
    { name: 'Печать' },
    { name: 'Постпечатная обработка' },
    { name: 'Упаковка и отгрузка' },
  ]);

  await resetDirectory('pricingFormulas', [
    { name: 'Цифровая печать: цена за тираж', formula: 'base + run * volume' },
    { name: 'Постпечатные работы: часовая ставка', formula: 'hours * rate' },
  ]);

  await resetDirectory('clientSources', [
    { name: 'Сарафанное радио' },
    { name: 'Сайт' },
    { name: 'Контекстная реклама' },
    { name: 'Постоянный клиент' },
  ]);

  await resetDirectory('staffRoles', [
    { name: 'Менеджер продаж' },
    { name: 'Технолог' },
    { name: 'Печатник' },
    { name: 'Оператор постпечатки' },
    { name: 'Бухгалтер' },
  ]);
};
