const db = require('../db/connection');

const tableName = 'product_price_tiers';

/**
 * Phase 3 — Task 2
 * Ценовые диапазоны по тиражам для продукции.
 */
async function getByProductId(productId) {
  return db(tableName)
    .where({ product_id: productId })
    .orderBy('min_qty', 'asc');
}

async function create(tier) {
  return db(tableName).insert(tier);
}

async function remove(id) {
  return db(tableName).where({ id }).del();
}

module.exports = {
  getByProductId,
  create,
  remove,
};
