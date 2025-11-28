const productModel = require('../models/productModel');

function validateProductPayload(body) {
  if (!body.name || !body.category) {
    const error = new Error('Поля name и category обязательны');
    error.status = 400;
    throw error;
  }
}

async function list(req, res, next) {
  try {
    const { search, category } = req.query;
    const products = await productModel.getAll({ search, category });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const product = await productModel.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    validateProductPayload(req.body);
    const created = await productModel.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    validateProductPayload(req.body);
    const existing = await productModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    const updated = await productModel.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await productModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    await productModel.remove(req.params.id);
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
