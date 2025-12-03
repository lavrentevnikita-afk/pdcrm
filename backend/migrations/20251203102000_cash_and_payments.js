/**
 * Cashbox & payments tables + payment fields on orders (Phase 6.1).
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // payments
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();

    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.decimal('amount', 12, 2).notNullable().defaultTo(0);
    table.string('method').notNullable(); // cash, card, bank, prepay, postpay, etc.
    table.datetime('paid_at').notNullable();

    table
      .integer('created_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    table.timestamps(true, true);
  });

  // cash_shifts
  await knex.schema.createTable('cash_shifts', (table) => {
    table.increments('id').primary();

    table.datetime('opened_at').notNullable();
    table.datetime('closed_at').nullable();

    table
      .integer('opened_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    table
      .integer('closed_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);

    table.timestamps(true, true);
  });

  // extra fields on orders
  await knex.schema.alterTable('orders', (table) => {
    table.decimal('paid_amount', 12, 2).notNullable().defaultTo(0);
    table.string('payment_status').notNullable().defaultTo('unpaid');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('paid_amount');
    table.dropColumn('payment_status');
  });

  await knex.schema.dropTableIfExists('cash_shifts');
  await knex.schema.dropTableIfExists('payments');
};
