/**
 * Role-based access control middleware.
 * Usage: authorize('Admin', 'Developer')
 * Must be used AFTER the protect middleware.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to perform this action`,
      });
    }
    next();
  };
};

module.exports = { authorize };
