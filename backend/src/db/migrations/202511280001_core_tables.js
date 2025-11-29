/**
 * Initial core tables: clients, product_categories, products, orders.
 *
 * Phase 3 note:
 * Здесь собраны базовые сущности справочника клиентов и продукции,
 * а также таблица заказов. Таблицы product_categories и products
 * используются в Phase 3 для нормализованного справочника продукции.
 */

exports.up = async function up(knex) {
  // Клиенты
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

  // Категории продукции (Phase 3 — Task 1)
  await knex.schema.createTable('product_categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('slug').nullable();
    table.text('comment').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Продукция (Phase 3 — Task 1)
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();

    // Нормализованная категория
    table
      .integer('category_id')
      .unsigned()
      .references('id')
      .inTable('product_categories')
      .onDelete('SET NULL')
      .index();

    // Базовая цена за единицу / тираж
    table.decimal('base_price', 10, 2).notNullable().defaultTo(0);

    table.text('comment').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Заказы (упрощённая структура, без позиций заказа)
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();

    table
      .integer('client_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('clients')
      .onDelete('RESTRICT')
      .index();

    // Менеджер / ответственный (ссылка на users.id, без FK для совместимости миграций)
    table.integer('manager_id').unsigned().nullable().index();

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
  await knex.schema.dropTableIfExists('product_categories');
  await knex.schema.dropTableIfExists('clients');
};
