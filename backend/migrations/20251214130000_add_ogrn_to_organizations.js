/**
 * Add missing OGRN column to organizations for existing databases.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('organizations', 'ogrn');

  if (!hasColumn) {
    await knex.schema.alterTable('organizations', (table) => {
      table.string('ogrn').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('organizations', 'ogrn');

  if (hasColumn) {
    await knex.schema.alterTable('organizations', (table) => {
      table.dropColumn('ogrn');
    });
  }
};
