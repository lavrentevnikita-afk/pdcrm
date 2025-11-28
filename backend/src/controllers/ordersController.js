const orderModel = require('../models/orderModel');

function validateOrderPayload(body) {
  if (body.total_amount != null && Number.isNaN(Number(body.total_amount))) {
    const error = new Error('Поле total_amount должно быть числом');
    error.status = 400;
    throw error;
  }
}

async function list(req, res, next) {
  try {
    const { status } = req.query;
    const orders = await orderModel.getAll({ status });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    validateOrderPayload(req.body);
    const created = await orderModel.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    validateOrderPayload(req.body);
    const existing = await orderModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    const updated = await orderModel.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await orderModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
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
