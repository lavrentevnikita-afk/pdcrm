/**
 * Seed initial product catalog with categories, products and price tiers.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  // Clean existing data
  await knex('product_price_tiers').del();
  await knex('products').del();
  await knex('product_categories').del();
};
