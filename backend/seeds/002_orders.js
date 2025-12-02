/**
 * Seed initial demo orders for dashboard.
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
      total_amount: 12500,
      status: 'in_progress',
      deadline: daysFromNow(1),
      is_hot: true,
    },
    {
      order_number: 'PD-1002',
      title: 'Футболки с логотипом “GreenTech”',
      total_amount: 48000,
      status: 'production',
      deadline: daysFromNow(3),
      is_hot: true,
    },
    {
      order_number: 'PD-1003',
      title: 'Буклеты для выставки',
      total_amount: 22000,
      status: 'new',
      deadline: daysFromNow(5),
      is_hot: false,
    },
    {
      order_number: 'PD-1004',
      title: 'Пакеты с логотипом',
      total_amount: 17500,
      status: 'completed',
      deadline: daysFromNow(-2),
      is_hot: false,
    },
    {
      order_number: 'PD-1005',
      title: 'Календари настенные',
      total_amount: 36500,
      status: 'completed',
      deadline: daysFromNow(-5),
      is_hot: false,
    },
    {
      order_number: 'PD-1006',
      title: 'Кружки “Coffee & Code”',
      total_amount: 15200,
      status: 'in_progress',
      deadline: daysFromNow(7),
      is_hot: false,
    },
    {
      order_number: 'PD-1007',
      title: 'Фирменные блокноты',
      total_amount: 19800,
      status: 'new',
      deadline: daysFromNow(2),
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
