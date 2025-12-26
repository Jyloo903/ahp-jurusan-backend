// src/middleware/superAdminMiddleware.js

module.exports = (req, res, next) => {
  // Check if user exists (from authMiddleware)
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Please login first.' 
    });
  }
  
  // Check if user is superadmin
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Super Admin privileges required.' 
    });
  }
  
  // User is superadmin, allow access
  next();
};