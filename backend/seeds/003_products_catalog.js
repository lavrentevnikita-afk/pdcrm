/**
 * Prepare catalog tables without demo данных so they are ready for real imports.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('product_price_tiers').del();
  await knex('products').del();
  await knex('product_categories').del();
};
