const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded; // { user_id, email, role }
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Not authenticated', 401);
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Access denied — insufficient permissions', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };