/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number').notNullable();
    table.string('title').notNullable();
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
    table.string('status').notNullable(); // new, in_progress, production, completed, cancelled
    table.dateTime('deadline').notNullable();
    table.boolean('is_hot').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('orders');
};
