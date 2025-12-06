/**
 * Seed demo orders with simple structure.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('order_items').del();
  await knex('orders').del();

  const clients = await knex('directories').where({ type: 'clients' });
  const clientsByName = new Map(
    clients.map((row) => {
      const data = row.data ? JSON.parse(row.data) : {};
      return [data.name, row.id];
    })
  );

  const now = new Date();

  const orders = [
    {
      clientName: 'Coffee&Co',
      comment: 'Визитки для кофейни',
      status: 'new',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { name: 'Дизайн макета', qty: 1, price: 1500 },
        { name: 'Печать 500 шт.', qty: 500, price: 6.5 },
      ],
    },
    {
      clientName: 'ООО «СеверСтрой»',
      comment: 'Плакаты А2 для акции',
      status: 'in_progress',
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { name: 'Печать 50 шт.', qty: 50, price: 180 },
        { name: 'Ламинация', qty: 50, price: 25 },
      ],
    },
    {
      clientName: 'Театр света',
      comment: 'Наклейки круг 5 см',
      status: 'done',
      deadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { name: 'Печать 1000 шт.', qty: 1000, price: 3.2 },
      ],
    },
  ];

  for (const order of orders) {
    const insertedIds = await knex('orders').insert({
      client_id: clientsByName.get(order.clientName) || null,
      status: order.status,
      deadline: order.deadline,
      comment: order.comment,
      total_amount: 0,
    });

    const orderId = insertedIds[0];
    let total = 0;

    for (const item of order.items) {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const lineTotal = qty * price;
      total += lineTotal;

      await knex('order_items').insert({
        order_id: orderId,
        name: item.name,
        qty,
        price,
        line_total: lineTotal,
        product_id: null,
      });
    }

    await knex('orders').where({ id: orderId }).update({
      total_amount: total,
    });
  }
};
