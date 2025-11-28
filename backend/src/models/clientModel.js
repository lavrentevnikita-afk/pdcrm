const db = require('../db/connection');

const tableName = 'clients';

async function getAll({ search } = {}) {
  let query = db(tableName).select('*').orderBy('created_at', 'desc');

  if (search) {
    const like = `%${search}%`;
    query = query.where((qb) => {
      qb.where('full_name', 'like', like)
        .orWhere('phone', 'like', like)
        .orWhere('email', 'like', like)
        .orWhere('organization_name', 'like', like);
    });
  }

  return query;
}

async function getById(id) {
  return db(tableName).where({ id }).first();
}

async function create(data) {
  const [id] = await db(tableName).insert({
    full_name: data.full_name,
    phone: data.phone,
    email: data.email || null,
    organization_name: data.organization_name || null,
    comment: data.comment || null,
  });

  return getById(id);
}

async function update(id, data) {
  await db(tableName)
    .where({ id })
    .update({
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      organization_name: data.organization_name || null,
      comment: data.comment || null,
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
