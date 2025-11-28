const db = require('../db/connection');

const tableName = 'orders';

async function getAll({ status } = {}) {
  let query = db(tableName)
    .select('*')
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where({ status });
  }

  return query;
}

async function getById(id) {
  return db(tableName).where({ id }).first();
}

async function create(data) {
  const [id] = await db(tableName).insert({
    client_id: data.client_id || null,
    status: data.status || 'new',
    total_amount: data.total_amount ?? 0,
    deadline: data.deadline || null,
    comment: data.comment || null,
  });

  return getById(id);
}

async function update(id, data) {
  await db(tableName)
    .where({ id })
    .update({
      client_id: data.client_id || null,
      status: data.status || 'new',
      total_amount: data.total_amount ?? 0,
      deadline: data.deadline || null,
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
