/**
 * Clear seeded orders.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('order_items').del();
  await knex('orders').del();
};
