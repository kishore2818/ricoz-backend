const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('../../config/env');

const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

const registerUser = async ({ name, email, password, role, department }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User already exists with this email');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Analyst',
    department: department || 'Private Equity Investment & IR'
  });

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    },
    token
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account deactivated. Contact system administrator.');
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    },
    token
  };
};

module.exports = {
  registerUser,
  loginUser,
  generateToken
};

