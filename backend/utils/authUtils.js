//authUtils.js
const jwt = require('jsonwebtoken');

const handleSignUpError = (err) => {
  const error = {
    username: '',
    email: '',
    password: '',
  };
  if (err.code === 11000) {
    if (err.keyValue.email) {
      error.email = 'Email already taken';
    } else if (err.keyValue.username) {
      error.username = 'Username already taken';
    }
  } else if (err.errors) {
    if (err.errors.username) {
      error.username = err.errors.username.message;
    }
    if (err.errors.password) {
      error.password = err.errors.password.message;
    }
    if (err.errors.email) {
      error.email = 'Please enter a valid email';
    }
  }
  else {
    // If no specific errors are found, return the whole error object
    return err;
  }

  return error;
};

const handleLogInError = (err) => {
  const errors = { username: '', password: '' };
  if (err.message === 'User not found') {
    errors.username = err.message;
  } else if (err.message === 'Incorrect password!!') {
    errors.password = err.message;
  }
  return errors;
};

const maxAge = 3600000; // 1 hour
const createToken = (username, userId) => {
  return jwt.sign(
    {
      username: username,
      user_id: userId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: maxAge }
  );
};

module.exports = {
  handleSignUpError,
  handleLogInError,
  createToken,
};
