/**
 * Create a dedicated organizations table used by seeds and directories data.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('organizations');

  if (!exists) {
    await knex.schema.createTable('organizations', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('inn').notNullable();
      table.string('kpp').nullable();
      table.string('legal_address').notNullable();
      table.string('contact_person').nullable();
      table.string('phone').notNullable();
      table.string('email').nullable();
      table.string('payment_terms').nullable();
      table.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('organizations');
};
