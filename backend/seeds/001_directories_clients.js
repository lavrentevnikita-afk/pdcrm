/**
 * Seed basic clients into the generic directories storage.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('directories').where({ type: 'clients' }).del();
};
