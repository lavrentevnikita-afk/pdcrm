/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
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

    table
      .integer('product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.string('product_name').notNullable();

    table.integer('quantity').notNullable().defaultTo(1);
    table.string('unit').notNullable().defaultTo('шт.');

    table.decimal('base_price', 12, 4).notNullable().defaultTo(0);
    table.decimal('unit_price', 12, 4).notNullable().defaultTo(0);
    table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0);
    table.decimal('discount_value', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_price', 12, 2).notNullable().defaultTo(0);

    table.text('comment');

    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_items');
};
