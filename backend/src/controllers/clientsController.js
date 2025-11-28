const clientModel = require('../models/clientModel');

function validateClientPayload(body) {
  if (!body.full_name || !body.phone) {
    const error = new Error('Поля full_name и phone обязательны');
    error.status = 400;
    throw error;
  }
}

async function list(req, res, next) {
  try {
    const { search } = req.query;
    const clients = await clientModel.getAll({ search });
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const client = await clientModel.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }
    res.json(client);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    validateClientPayload(req.body);
    const created = await clientModel.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    validateClientPayload(req.body);
    const existing = await clientModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }
    const updated = await clientModel.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await clientModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }
    await clientModel.remove(req.params.id);
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
