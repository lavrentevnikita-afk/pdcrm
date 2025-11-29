const productCategoryModel = require('../models/productCategoryModel');

/**
 * Простой контроллер для справочника категорий продукции.
 * Пока только чтение — достаточно для Phase 3.
 */
async function list(req, res, next) {
  try {
    const categories = await productCategoryModel.getAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
};
