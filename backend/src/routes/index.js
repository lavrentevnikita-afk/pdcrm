const express = require('express');

const clientsRoutes = require('./clientsRoutes');
const authRoutes = require('./authRoutes');
const productsRoutes = require('./productsRoutes');
const ordersRoutes = require('./ordersRoutes');
const productCategoriesRoutes = require('./productCategoriesRoutes');

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/clients', clientsRoutes);
router.use('/products', productsRoutes);
router.use('/product-categories', productCategoriesRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
