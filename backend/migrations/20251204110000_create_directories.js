/**
 * Универсальная таблица для справочников (категории, клиенты, материалы и т.д.).
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('directories', (table) => {
    table.increments('id').primary();
    table.string('type').notNullable().index();
    table.text('data').notNullable(); // JSON c произвольными полями
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('directories');
};
