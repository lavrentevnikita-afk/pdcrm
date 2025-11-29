const db = require('../db/connection');

const tableName = 'products';

/**
 * Справочник продукции.
 * Phase 3 — Task 1: products + product_categories.
 */
async function getAll({ search, category, category_id } = {}) {
  let query = db(tableName)
    .select(
      'products.*',
      'product_categories.name as category_name'
    )
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .orderBy('products.created_at', 'desc');

  // Фильтр по ID категории
  if (category_id) {
    query = query.where('products.category_id', category_id);
  }

  // Фильтр по имени категории (строкой), используется в простых UI-фильтрах
  if (category) {
    query = query.where('product_categories.name', category);
  }

  // Поиск по наименованию / комментарию
  if (search) {
    const like = `%${search}%`;
    query = query.where((qb) => {
      qb.where('products.name', 'like', like).orWhere('products.comment', 'like', like);
    });
  }

  return query;
}

async function getById(id) {
  return db(tableName)
    .select(
      'products.*',
      'product_categories.name as category_name'
    )
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .where('products.id', id)
    .first();
}

async function create(product) {
  return db(tableName).insert(product);
}

async function update(id, updates) {
  await db(tableName)
    .where({ id })
    .update({
      ...updates,
      updated_at: db.fn.now(),
    });

  return getById(id);
}

async function remove(id) {
  return db(tableName).where({ id }).del();
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
