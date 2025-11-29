const db = require('../db/connection');

const tableName = 'orders';

/**
 * Phase 3 — Task 3
 * Расширенный список заказов с фильтрами:
 * - мои / все (manager_id)
 * - статус
 * - даты
 * - клиент
 */
async function getAll({
  status,
  scope,
  managerId,
  clientId,
  clientSearch,
  dateFrom,
  dateTo,
} = {}) {
  let query = db(tableName)
    .select(
      'orders.*',
      'clients.full_name as client_full_name',
      'clients.phone as client_phone',
      'clients.organization_name as client_organization_name',
      'users.name as manager_name'
    )
    .leftJoin('clients', 'orders.client_id', 'clients.id')
    .leftJoin('users', 'orders.manager_id', 'users.id')
    .orderBy('orders.created_at', 'desc');

  if (status) {
    query = query.where('orders.status', status);
  }

  if (scope === 'my' && managerId) {
    query = query.where('orders.manager_id', managerId);
  }

  if (clientId) {
    query = query.where('orders.client_id', clientId);
  }

  if (clientSearch) {
    const like = `%${clientSearch}%`;
    query = query.where((qb) => {
      qb.where('clients.full_name', 'like', like)
        .orWhere('clients.phone', 'like', like)
        .orWhere('clients.organization_name', 'like', like);
    });
  }

  if (dateFrom) {
    query = query.where('orders.created_at', '>=', dateFrom);
  }

  if (dateTo) {
    query = query.where('orders.created_at', '<=', dateTo);
  }

  return query;
}

async function getById(id) {
  return db(tableName)
    .select(
      'orders.*',
      'clients.full_name as client_full_name',
      'clients.phone as client_phone',
      'clients.organization_name as client_organization_name',
      'users.name as manager_name'
    )
    .leftJoin('clients', 'orders.client_id', 'clients.id')
    .leftJoin('users', 'orders.manager_id', 'users.id')
    .where('orders.id', id)
    .first();
}

async function create(order) {
  return db(tableName).insert(order);
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
