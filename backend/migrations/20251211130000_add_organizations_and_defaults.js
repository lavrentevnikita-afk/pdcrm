/**
 * Safe guard migration that aligns legacy additions after the orders reset.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  const hasClientId = await knex.schema.hasColumn('orders', 'client_id');

  if (!hasClientId) {
    await knex.schema.alterTable('orders', (table) => {
      table.integer('client_id').unsigned().nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasClientId = await knex.schema.hasColumn('orders', 'client_id');

  if (hasClientId) {
    await knex.schema.alterTable('orders', (table) => {
      table.dropColumn('client_id');
    });
  }
};
