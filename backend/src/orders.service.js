/**
 * Service helpers for order pricing and totals.
 * These functions will be used by the order creation/update endpoints
 * when the калькулятор is wired on the frontend.
 */

/**
 * Рассчитать стоимость позиции заказа по тиражу и ценовым уровням.
 *
 * Алгоритм:
 * 1. Берём базовую цену продукта (`products.base_price`).
 * 2. Ищем подходящий ценовой уровень в `product_price_tiers` по тиражу.
 * 3. Если в уровне задан `price_per_unit` — используем его.
 *    Если задан `discount_percent` — применяем скидку к базовой цене.
 *
 * @param {import('knex').Knex} knex
 * @param {number} productId
 * @param {number} quantity
 * @returns {Promise<{
 *   product: any,
 *   quantity: number,
 *   basePrice: number,
 *   unitPrice: number,
 *   discountPercent: number,
 *   discountValue: number,
 *   totalPrice: number
 * }>}
 */
async function calculateOrderItemPrice(knex, productId, quantity) {
  if (!productId || !quantity || quantity <= 0) {
    throw new Error('Product and positive quantity are required');
  }

  const product = await knex('products').where({ id: productId }).first();
  if (!product) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }

  const basePrice = Number(product.base_price || 0);

  const tiers = await knex('product_price_tiers')
    .where({ product_id: productId })
    .orderBy('min_qty', 'asc');

  let unitPrice = basePrice;
  let discountPercent = 0;

  // Подбираем уровень, который подходит под тираж
  for (const tier of tiers) {
    const min = Number(tier.min_qty || 0);
    const max = tier.max_qty == null ? null : Number(tier.max_qty);

    if (quantity >= min && (max === null || quantity <= max)) {
      if (tier.price_per_unit != null) {
        unitPrice = Number(tier.price_per_unit);
      } else if (tier.discount_percent != null) {
        discountPercent = Number(tier.discount_percent || 0);
        unitPrice = basePrice * (1 - discountPercent / 100);
      }
    }
  }

  const qty = Number(quantity);
  const lineWithoutDiscount = unitPrice * qty;

  let discountValue = 0;
  if (discountPercent > 0) {
    discountValue = (lineWithoutDiscount * discountPercent) / 100;
  }

  const totalPrice = lineWithoutDiscount - discountValue;

  return {
    product,
    quantity: qty,
    basePrice,
    unitPrice,
    discountPercent,
    discountValue,
    totalPrice,
  };
}

/**
 * Пересчитать итоги по заказу:
 *  - суммарную стоимость позиций
 *  - итог к оплате (пока без учёта оплат, т.к. касса будет в Phase 6)
 *
 * На данном этапе:
 *  - `sum_total` = сумма `order_items.total_price`
 *  - `total_amount` = `sum_total` (в будущем может отличаться из-за скидки/оплат)
 *
 * @param {import('knex').Knex} knex
 * @param {number} orderId
 * @returns {Promise<{ sumTotal: number, totalAmount: number }>}
 */
async function recalculateOrderTotals(knex, orderId) {
  const items = await knex('order_items').where({ order_id: orderId });

  const sumTotal = items.reduce(
    (acc, item) => acc + Number(item.total_price || 0),
    0
  );

  // Пока нет системы оплат, остаток = totalAmount
  const totalAmount = sumTotal;

  await knex('orders')
    .where({ id: orderId })
    .update({
      sum_total: sumTotal,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    });

  return { sumTotal, totalAmount };
}

module.exports = {
  calculateOrderItemPrice,
  recalculateOrderTotals,
};
