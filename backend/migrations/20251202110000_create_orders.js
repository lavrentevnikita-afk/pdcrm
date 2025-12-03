/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number').notNullable();
    table.string('title').notNullable();

    // Клиент
    table.string('client_name');
    table.string('client_phone');

    // Ответственный за заказ (создатель / ведущий)
    table.integer('manager_id').unsigned().notNullable();

    // Статус: new, in_progress, production, completed, cancelled
    table.string('status').notNullable().defaultTo('new');

    // Дедлайны
    table.dateTime('deadline_at'); // основной дедлайн
    table.dateTime('deadline'); // дублирование для совместимости с дашбордом

    // Сумма
    table.decimal('sum_total', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);

    // Признак «горящего» заказа
    table.boolean('is_hot').notNullable().defaultTo(false);

    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('orders');
};
