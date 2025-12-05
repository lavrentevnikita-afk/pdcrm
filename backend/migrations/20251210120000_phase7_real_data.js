/**
 * Add real tables for directories, warehouse, permissions and notifications.
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.table('users', (table) => {
    table.string('department');
    table.string('phone');
    table.string('email');
    table.integer('workload').notNullable().defaultTo(0);
  });

  await knex.schema.table('products', (table) => {
    table.string('sku');
  });

  await knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('segment');
    table.string('contact');
    table.text('note');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('materials', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('type');
    table.string('unit');
    table.text('note');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('suppliers', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('status');
    table.string('contact');
    table.text('note');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('warehouse_items', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('unit');
    table.integer('stock').notNullable().defaultTo(0);
    table.integer('reorder_level').notNullable().defaultTo(0);
    table.string('supplier');
    table.dateTime('last_movement_at');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('warehouse_movements', (table) => {
    table.increments('id').primary();
    table
      .integer('item_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('warehouse_items')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('type').notNullable();
    table.integer('quantity').notNullable();
    table.text('note');
    table.dateTime('created_at').notNullable();
  });

  await knex.schema.createTable('purchase_requests', (table) => {
    table.increments('id').primary();
    table.string('material').notNullable();
    table.integer('quantity').notNullable();
    table.string('status').notNullable().defaultTo('pending');
    table.string('requested_by');
    table.dateTime('created_at').notNullable();
  });

  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.dateTime('created_at').notNullable();
  });

  await knex.schema.createTable('user_permissions', (table) => {
    table
      .integer('user_id')
      .unsigned()
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.boolean('orders').notNullable().defaultTo(true);
    table.boolean('production').notNullable().defaultTo(false);
    table.boolean('cashbox').notNullable().defaultTo(false);
    table.boolean('analytics').notNullable().defaultTo(false);
    table.boolean('warehouse').notNullable().defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_permissions');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('purchase_requests');
  await knex.schema.dropTableIfExists('warehouse_movements');
  await knex.schema.dropTableIfExists('warehouse_items');
  await knex.schema.dropTableIfExists('suppliers');
  await knex.schema.dropTableIfExists('materials');
  await knex.schema.dropTableIfExists('clients');

  await knex.schema.table('products', (table) => {
    table.dropColumn('sku');
  });

  await knex.schema.table('users', (table) => {
    table.dropColumn('department');
    table.dropColumn('phone');
    table.dropColumn('email');
    table.dropColumn('workload');
  });
};
