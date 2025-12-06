/**
 * Seed demo orders with simple structure tied to products.
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

  let products = await knex('products').select('id', 'name', 'base_price');

  // Guarantee at least one product to satisfy NOT NULL product_id on order_items
  if (products.length === 0) {
    const [placeholderId] = await knex('products').insert({
      name: 'Демо продукт',
      base_price: 0,
      is_active: 1,
    });

    products = [
      {
        id: placeholderId,
        name: 'Демо продукт',
        base_price: 0,
      },
    ];
  }

  const productById = new Map(products.map((p) => [p.id, p]));

  const findProduct = (id) => productById.get(id) || products[0];

  const now = new Date();

  const orders = [
    {
      clientName: 'Coffee&Co',
      comment: 'Промо для кофейни',
      status: 'new',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { product_id: 1, qty: 500, price: 6.5 },
        { product_id: 2, qty: 200, price: 9.5 },
      ],
    },
    {
      clientName: 'ООО «СеверСтрой»',
      comment: 'Тираж для выставки',
      status: 'in_progress',
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { product_id: 2, qty: 50, price: 180 },
        { product_id: 1, qty: 50, price: 25 },
      ],
    },
    {
      clientName: 'Театр света',
      comment: 'Сувениры',
      status: 'done',
      deadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ product_id: 4, qty: 100, price: 350 }],
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
      const product = findProduct(item.product_id);
      const qty = Number(item.qty) || 0;
      const price = item.price === undefined ? Number(product.base_price || 0) : Number(item.price) || 0;
      const lineTotal = qty * price;
      total += lineTotal;

      await knex('order_items').insert({
        order_id: orderId,
        product_id: product.id,
        name: product.name,
        qty,
        price,
        line_total: lineTotal,
      });
    }

    await knex('orders').where({ id: orderId }).update({
      total_amount: total,
    });
  }
};
