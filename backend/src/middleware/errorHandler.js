// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  console.error('❌ Error handler:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: 'Request failed',
    message,
  });
};
