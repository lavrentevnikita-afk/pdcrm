const orderModel = require('../models/orderModel');

function validateOrderPayload(body) {
  if (body.total_amount != null && Number.isNaN(Number(body.total_amount))) {
    const error = new Error('Поле total_amount должно быть числом');
    error.status = 400;
    throw error;
  }
}

/**
 * GET /api/orders
 * Поддерживаемые параметры:
 * - status
 * - scope (my|all)
 * - manager_id
 * - client_id
 * - client_search
 * - date_from
 * - date_to
 */
async function list(req, res, next) {
  try {
    const {
      status,
      scope,
      manager_id: managerId,
      client_id: clientId,
      client_search: clientSearch,
      date_from: dateFrom,
      date_to: dateTo,
    } = req.query;

    const orders = await orderModel.getAll({
      status,
      scope,
      managerId,
      clientId,
      clientSearch,
      dateFrom,
      dateTo,
    });

    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Заказ не найден',
      });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    validateOrderPayload(req.body);
    const [id] = await orderModel.create(req.body);
    const order = await orderModel.getById(id);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    validateOrderPayload(req.body);
    const order = await orderModel.update(req.params.id, req.body);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await orderModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
};
