/**
 * Seed initial demo orders for dashboard and orders list.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('orders').del();

  const now = new Date();

  function daysFromNow(days) {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  const orders = [
    {
      order_number: 'PD-1001',
      title: 'Визитки для ИП Смирнов',
      client_name: 'ИП Смирнов',
      client_phone: '+7 900 111-22-33',
      manager_id: 1,
      status: 'in_progress',
      deadline_at: daysFromNow(1),
      deadline: daysFromNow(1),
      sum_total: 12500,
      total_amount: 12500,
      is_hot: true,
    },
    {
      order_number: 'PD-1002',
      title: 'Футболки с логотипом «GreenTech»',
      client_name: 'ООО «ГринТех»',
      client_phone: '+7 901 234-56-78',
      manager_id: 2,
      status: 'production',
      deadline_at: daysFromNow(3),
      deadline: daysFromNow(3),
      sum_total: 48000,
      total_amount: 48000,
      is_hot: true,
    },
    {
      order_number: 'PD-1003',
      title: 'Календари настенные 2026',
      client_name: 'Студия «Новый год»',
      client_phone: '+7 912 333-44-55',
      manager_id: 3,
      status: 'new',
      deadline_at: daysFromNow(10),
      deadline: daysFromNow(10),
      sum_total: 32000,
      total_amount: 32000,
      is_hot: false,
    },
    {
      order_number: 'PD-1004',
      title: 'Буклеты «Весенняя распродажа»',
      client_name: 'ТЦ «Северный»',
      client_phone: '+7 913 777-88-99',
      manager_id: 4,
      status: 'completed',
      deadline_at: daysFromNow(-2),
      deadline: daysFromNow(-2),
      sum_total: 27800,
      total_amount: 27800,
      is_hot: false,
    },
    {
      order_number: 'PD-1005',
      title: 'Пакеты с логотипом',
      client_name: 'Кафе «Точка кофе»',
      client_phone: '+7 904 555-66-77',
      manager_id: 5,
      status: 'completed',
      deadline_at: daysFromNow(-5),
      deadline: daysFromNow(-5),
      sum_total: 15400,
      total_amount: 15400,
      is_hot: false,
    },
    {
      order_number: 'PD-1006',
      title: 'Кружки «Coffee & Code»',
      client_name: 'Коворкинг «IT-место»',
      client_phone: '+7 905 101-20-30',
      manager_id: 6,
      status: 'in_progress',
      deadline_at: daysFromNow(7),
      deadline: daysFromNow(7),
      sum_total: 15200,
      total_amount: 15200,
      is_hot: false,
    },
    {
      order_number: 'PD-1007',
      title: 'Фирменные блокноты',
      client_name: 'Digital-агентство «Pixel»',
      client_phone: '+7 906 222-33-44',
      manager_id: 7,
      status: 'new',
      deadline_at: daysFromNow(2),
      deadline: daysFromNow(2),
      sum_total: 19800,
      total_amount: 19800,
      is_hot: true,
    },
  ];

  // Insert with created_at spread over последнюю неделю
  for (let i = 0; i < orders.length; i += 1) {
    const created = new Date(now);
    created.setDate(now.getDate() - (i % 7));
    await knex('orders').insert({
      ...orders[i],
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    });
  }
};
