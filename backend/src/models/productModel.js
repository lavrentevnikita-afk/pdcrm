const db = require('../db/connection');

const tableName = 'products';

async function getAll({ search, category } = {}) {
  let query = db(tableName).select('*').orderBy('created_at', 'desc');

  if (category) {
    query = query.where('category', category);
  }

  if (search) {
    const like = `%${search}%`;
    query = query.where((qb) => {
      qb.where('name', 'like', like).orWhere('comment', 'like', like);
    });
  }

  return query;
}

async function getById(id) {
  return db(tableName).where({ id }).first();
}

async function create(data) {
  const [id] = await db(tableName).insert({
    name: data.name,
    category: data.category,
    base_price: data.base_price ?? 0,
    comment: data.comment || null,
    is_active: data.is_active ?? true,
  });

  return getById(id);
}

async function update(id, data) {
  await db(tableName)
    .where({ id })
    .update({
      name: data.name,
      category: data.category,
      base_price: data.base_price ?? 0,
      comment: data.comment || null,
      is_active: data.is_active ?? true,
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
