exports.seed = async function (knex) {
  await knex('notifications').del();
  await knex('warehouse_movements').del();
  await knex('warehouse_items').del();
  await knex('purchase_requests').del();
  await knex('clients').del();
  await knex('materials').del();
  await knex('suppliers').del();
  await knex('organizations').del();
};
