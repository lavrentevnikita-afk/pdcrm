/**
 * Phase 3 — Task 2
 * Модель product_price_tiers: ценовые диапазоны/скидки в зависимости от тиража.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('product_price_tiers', (table) => {
    table.increments('id').primary();

    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .index();

    // Нижняя граница тиража (включительно)
    table.integer('min_qty').notNullable();

    // Верхняя граница тиража (включительно), null = "от min_qty и выше"
    table.integer('max_qty').nullable();

    // Явная цена за единицу при данном диапазоне (опционально)
    table.decimal('price_per_unit', 10, 2).nullable();

    // Либо скидка в процентах относительно base_price
    table.decimal('discount_percent', 5, 2).nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('product_price_tiers');
};
