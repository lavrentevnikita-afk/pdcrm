/**
 * Reset orders schema to the simplified version.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // Drop dependent tables first
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');

  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('client_id').unsigned().nullable();
    table.string('status').notNullable().defaultTo('new');
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
    table.dateTime('deadline').nullable();
    table.text('comment').nullable();
  });

  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.integer('product_id').unsigned().nullable();
    table.string('name').notNullable();
    table.integer('qty').notNullable().defaultTo(1);
    table.decimal('price', 12, 2).notNullable().defaultTo(0);
    table.decimal('line_total', 12, 2).notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');

  // payments table is not recreated in down to keep rollback simple
  await knex.schema.dropTableIfExists('payments');
};
