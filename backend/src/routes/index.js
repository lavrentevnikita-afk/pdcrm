const express = require('express');

const clientsRoutes = require('./clientsRoutes');
const productsRoutes = require('./productsRoutes');
const ordersRoutes = require('./ordersRoutes');

const router = express.Router();

router.use('/clients', clientsRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
