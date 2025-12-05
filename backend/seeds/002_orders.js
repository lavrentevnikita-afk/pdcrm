/**
 * Clear demo orders so the system starts without заглушки.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('order_items').del();
  await knex('orders').del();
};
