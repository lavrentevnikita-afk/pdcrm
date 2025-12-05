/**
 * Extend directory schema with organizations, product defaults and client contact fields.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('products', (table) => {
    table.integer('default_run').notNullable().defaultTo(1);
  });

  await knex.schema.alterTable('clients', (table) => {
    table.string('phone');
    table.string('email');
  });

  await knex.schema.createTable('organizations', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('tax_id');
    table.string('contact_person');
    table.string('phone');
    table.string('email');
    table.text('note');
    table.timestamps(true, true);
  });

  await knex.schema.alterTable('orders', (table) => {
    table.integer('client_id').unsigned().references('id').inTable('clients');
    table
      .integer('organization_id')
      .unsigned()
      .references('id')
      .inTable('organizations');
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('organization_id');
    table.dropColumn('client_id');
  });

  await knex.schema.dropTableIfExists('organizations');

  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('email');
    table.dropColumn('phone');
  });

  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('default_run');
  });
};
