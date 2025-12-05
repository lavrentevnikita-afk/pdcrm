/**
 * Seed initial product catalog with categories, products and price tiers.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  // Clean existing data
  await knex('product_price_tiers').del();
  await knex('products').del();
  await knex('product_categories').del();

  const categories = [
    { id: 1, name: 'Полиграфия — визитки', slug: 'business_cards', sort_order: 1 },
    { id: 2, name: 'Полиграфия — листовки', slug: 'flyers', sort_order: 2 },
    { id: 3, name: 'Текстиль', slug: 'textile', sort_order: 3 },
    { id: 4, name: 'Сувениры / Керамика', slug: 'souvenirs', sort_order: 4 },
  ];

  await knex('product_categories').insert(categories);

  const products = [
    {
      id: 1,
      name: 'Визитки 90×50, 4+4, мелованный 300 г/м²',
      category_id: 1,
      sku: 'PR-001',
      base_price: 8.0,
      unit: 'шт.',
      comment: 'Классические полноцветные визитки на мелованной бумаге.',
      is_active: 1,
    },
    {
      id: 2,
      name: 'Листовки А5, 4+4, мелованный 130 г/м²',
      category_id: 2,
      sku: 'PR-024',
      base_price: 10.0,
      unit: 'шт.',
      comment: 'Листовки для промо и раздачи.',
      is_active: 1,
    },
    {
      id: 3,
      name: 'Футболка белая, полноцветный перенос (DTF)',
      category_id: 3,
      sku: 'TX-011',
      base_price: 650.0,
      unit: 'шт.',
      comment: 'Белая футболка с полноцветной печатью спереди.',
      is_active: 1,
    },
    {
      id: 4,
      name: 'Кружка керамическая с логотипом',
      category_id: 4,
      sku: 'SV-042',
      base_price: 350.0,
      unit: 'шт.',
      comment: 'Классическая кружка с полноцветным принтом.',
      is_active: 1,
    },
  ];

  await knex('products').insert(products);

  const tiers = [
    // Визитки
    { product_id: 1, min_qty: 1,   max_qty: 99,  price_per_unit: 12.0, discount_percent: null },
    { product_id: 1, min_qty: 100, max_qty: 499, price_per_unit: 7.0,  discount_percent: null },
    { product_id: 1, min_qty: 500, max_qty: 999, price_per_unit: 4.5,  discount_percent: null },
    { product_id: 1, min_qty: 1000, max_qty: null, price_per_unit: 3.5, discount_percent: null },

    // Листовки
    { product_id: 2, min_qty: 100, max_qty: 499, price_per_unit: 6.5, discount_percent: null },
    { product_id: 2, min_qty: 500, max_qty: 1999, price_per_unit: 3.2, discount_percent: null },
    { product_id: 2, min_qty: 2000, max_qty: null, price_per_unit: 2.4, discount_percent: null },

    // Футболки — скидка процентом
    { product_id: 3, min_qty: 1,  max_qty: 9,   price_per_unit: null, discount_percent: 0 },
    { product_id: 3, min_qty: 10, max_qty: 29,  price_per_unit: null, discount_percent: 5 },
    { product_id: 3, min_qty: 30, max_qty: null, price_per_unit: null, discount_percent: 10 },

    // Кружки — фиксированная цена
    { product_id: 4, min_qty: 1,  max_qty: 9,  price_per_unit: 450.0, discount_percent: null },
    { product_id: 4, min_qty: 10, max_qty: 49, price_per_unit: 320.0, discount_percent: null },
    { product_id: 4, min_qty: 50, max_qty: null, price_per_unit: 260.0, discount_percent: null },
  ];

  await knex('product_price_tiers').insert(tiers);
};
