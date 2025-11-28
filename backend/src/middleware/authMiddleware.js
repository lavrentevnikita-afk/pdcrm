const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Требуется токен авторизации',
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Неверный формат заголовка Authorization',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Недействительный или истёкший токен',
    });
  }
}

module.exports = authenticateToken;
