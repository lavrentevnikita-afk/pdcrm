const db = require('../db/connection');

const tableName = 'product_categories';

/**
 * Справочник категорий продукции.
 * Используется для фильтрации и отображения в UI.
 */
async function getAll() {
  return db(tableName)
    .select('*')
    .orderBy('name', 'asc');
}

async function getById(id) {
  return db(tableName).where({ id }).first();
}

module.exports = {
  getAll,
  getById,
};
