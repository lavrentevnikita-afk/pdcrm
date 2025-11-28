/**
 * Initial core tables: clients, products, orders.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table.string('full_name').notNullable();
    table.string('phone').notNullable();
    table.string('email').nullable();
    table.string('organization_name').nullable();
    table.text('comment').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('category').notNullable();
    table.decimal('base_price', 10, 2).notNullable().defaultTo(0);
    table.text('comment').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table
      .integer('client_id')
      .unsigned()
      .references('id')
      .inTable('clients')
      .onDelete('RESTRICT');
    table.string('status').notNullable().defaultTo('new'); // new, in_progress, done, cancelled
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.datetime('deadline').nullable();
    table.text('comment').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('clients');
};
