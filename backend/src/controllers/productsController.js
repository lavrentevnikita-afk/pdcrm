const productModel = require('../models/productModel');

function validateProductPayload(body) {
  if (!body.name) {
    const error = new Error('Поле name обязательно');
    error.status = 400;
    throw error;
  }

  if (!body.category_id) {
    const error = new Error('Поле category_id обязательно');
    error.status = 400;
    throw error;
  }
}

async function list(req, res, next) {
  try {
    const { search, category, category_id: categoryId } = req.query;
    const products = await productModel.getAll({
      search,
      category,
      category_id: categoryId,
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const product = await productModel.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Продукт не найден',
      });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    validateProductPayload(req.body);
    const [id] = await productModel.create(req.body);
    const product = await productModel.getById(id);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    validateProductPayload({ ...req.body, category_id: req.body.category_id ?? req.body.category_id });
    const product = await productModel.update(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
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
