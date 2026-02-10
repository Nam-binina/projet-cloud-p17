const requireRole = (role) => (req, res, next) => {
  const userRole = req.user?.role || 'user';
  if (userRole !== role) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

module.exports = requireRole;
