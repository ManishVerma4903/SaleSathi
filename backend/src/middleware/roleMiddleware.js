/**
 * Role-Based Access Control Middleware
 * Restricts access to routes based on user roles
 */

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 * @returns {Function} - Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Please login first'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied - Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    
    next();
  };
};

/**
 * Check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Please login first'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Only admin can perform this action'
    });
  }
  
  next();
};

/**
 * Check if user is shop owner
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isShopOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Please login first'
    });
  }
  
  if (req.user.role !== 'shop_owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Only shop owner can perform this action'
    });
  }
  
  next();
};

module.exports = { authorize, isAdmin, isShopOwner };
