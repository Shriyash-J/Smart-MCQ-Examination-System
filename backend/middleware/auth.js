const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      if (!req.user) return res.status(401).json({ message: 'User not found' });
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

const instructor = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') next();
  else res.status(403).json({ message: 'Instructor access required' });
};

const student = (req, res, next) => {
  if (req.user && req.user.role === 'student') next();
  else res.status(403).json({ message: 'Student access required' });
};

module.exports = { protect, instructor, student };   // ✅ Object export is correct here