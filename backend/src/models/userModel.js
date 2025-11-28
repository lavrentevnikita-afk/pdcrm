const db = require('../db/connection');

const tableName = 'users';

async function getAll() {
  return db(tableName)
    .select('id', 'name', 'role', 'is_active', 'created_at')
    .orderBy('name', 'asc');
}

async function getById(id) {
  return db(tableName).where({ id }).first();
}

async function getByAccessCodeHash(accessCodeHash) {
  if (!accessCodeHash) return null;

  return db(tableName)
    .where({ access_code_hash: accessCodeHash, is_active: 1 })
    .first();
}

async function create(user) {
  return db(tableName).insert(user);
}

module.exports = {
  getAll,
  getById,
  getByAccessCodeHash,
  create,
};
