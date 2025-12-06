/**
 * Ensure order items are always linked to a product and keep a name copy.
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  const trx = await knex.transaction();
  try {
    const ensureFallbackProduct = async () => {
      let category = await trx('product_categories').where({ slug: 'internal_misc' }).first();
      if (!category) {
        const [categoryId] = await trx('product_categories').insert({
          name: 'Служебные товары',
          slug: 'internal_misc',
          sort_order: 999,
        });
        category = await trx('product_categories').where({ id: categoryId }).first();
      }

      let product = await trx('products')
        .where({ name: 'Специальный продукт: ручной ввод' })
        .first();
      if (!product) {
        const [productId] = await trx('products').insert({
          name: 'Специальный продукт: ручной ввод',
          category_id: category?.id || null,
          base_price: 0,
          unit: 'шт.',
          comment: 'Служебный товар для ручного ввода позиций заказа.',
          is_active: true,
        });
        product = await trx('products').where({ id: productId }).first();
      }
      return product;
    };

    const fallbackProduct = await ensureFallbackProduct();

    const existingItems = await trx('order_items').select();

    await trx.schema.renameTable('order_items', 'order_items_old');

    await trx.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
      table.string('name').notNullable();
      table.integer('qty').notNullable().defaultTo(1);
      table.decimal('price', 12, 2).notNullable().defaultTo(0);
      table.decimal('line_total', 12, 2).notNullable().defaultTo(0);
    });

    if (existingItems.length) {
      for (const item of existingItems) {
        await trx('order_items').insert({
          order_id: item.order_id,
          product_id: item.product_id || fallbackProduct.id,
          name: item.name || 'Позиция',
          qty: item.qty || 0,
          price: item.price || 0,
          line_total: item.line_total || 0,
        });
      }
    }

    await trx.schema.dropTableIfExists('order_items_old');

    await trx.commit();
  } catch (err) {
    await trx.rollback();
    throw err;
  }
};

exports.down = async function (knex) {
  const trx = await knex.transaction();
  try {
    const existingItems = await trx('order_items').select();

    await trx.schema.renameTable('order_items', 'order_items_enforced');
    await trx.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      table.integer('product_id').unsigned().nullable();
      table.string('name').notNullable();
      table.integer('qty').notNullable().defaultTo(1);
      table.decimal('price', 12, 2).notNullable().defaultTo(0);
      table.decimal('line_total', 12, 2).notNullable().defaultTo(0);
    });

    if (existingItems.length) {
      for (const item of existingItems) {
        await trx('order_items').insert({
          order_id: item.order_id,
          product_id: item.product_id || null,
          name: item.name || 'Позиция',
          qty: item.qty || 0,
          price: item.price || 0,
          line_total: item.line_total || 0,
        });
      }
    }

    await trx.schema.dropTableIfExists('order_items_enforced');
    await trx.commit();
  } catch (err) {
    await trx.rollback();
    throw err;
  }
};
