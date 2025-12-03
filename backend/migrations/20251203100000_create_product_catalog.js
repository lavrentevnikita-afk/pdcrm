/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // Категории продукции
  await knex.schema.createTable('product_categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('slug');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  // Номенклатура продукции
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();

    table
      .integer('category_id')
      .unsigned()
      .references('id')
      .inTable('product_categories')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.decimal('base_price', 12, 2).notNullable().defaultTo(0);
    table.string('unit').notNullable().defaultTo('шт.');
    table.text('comment');
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamps(true, true);
  });

  // Ценовые уровни по тиражам
  await knex.schema.createTable('product_price_tiers', (table) => {
    table.increments('id').primary();

    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.integer('min_qty').notNullable();
    table.integer('max_qty'); // null = бесконечность вверх

    // Либо фиксированная цена за единицу, либо % скидки от базовой цены
    table.decimal('price_per_unit', 12, 4);
    table.decimal('discount_percent', 5, 2);

    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_price_tiers');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('product_categories');
};
