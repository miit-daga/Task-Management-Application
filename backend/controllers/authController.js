//authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authUtils = require('../utils/authUtils');
const deadlineNotifier = require('../notifications/deadlineNotifier');



// @desc    Get all users
// @route   GET /users
// For testing purposes
// @access  Private
const getAllUsers = async (req, resp) => {
  try {
    const result = await User.find();
    resp.status(200).json(result);
  } catch (err) {
    resp.status(500).json({ message: 'Failed to retrieve users from database' });
  }
};


// @desc    Create a new user
// @route   POST /signup
// @access  Public
const createUser = async (req, resp) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({
      username,
      email,
      password,
    });
    await user.save();

    // Subscribe user to deadline notifications
    await deadlineNotifier.subscribeUser(email);

    const token = authUtils.createToken(
      user.username,
      user._id,
    );

    resp.cookie('jwt', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 3600000,
      partitioned: true
    });

    resp.status(201).json({
      user: user,
    });
  } catch (err) {
    const errors = authUtils.handleSignUpError(err);
    console.log(errors);
    resp.status(500).json({ errors });
  }
};

// @desc    Log in a user
// @route   POST /login
// @access  Public
const loginUser = async (req, resp) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });

    if (user) {
      const auth = await bcrypt.compare(password, user.password);
      if (auth) {
        const token = authUtils.createToken(
          user.username,
          user._id,
        );
        resp.cookie('jwt', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          partitioned: true,
          maxAge: 3600000 // 1 hour
        });
        resp.status(200).json({
          "user": user,
        });
      } else {
        throw new Error('Incorrect password!!');
      }
    } else {
      throw new Error('User not found');
    }
  } catch (err) {
    console.log(err);
    const errors = authUtils.handleLogInError(err);
    resp.status(401).json({ errors });
  }
};

// @desc    Log out a user
// @route   GET /logout
// @access  Public
const logoutUser = async (req, resp) => {
  const token = req.cookies.jwt;
  resp.cookie('jwt', token, {
    httpOnly: true,
    secure: true,
    partitioned: true,
    sameSite: 'None',
    maxAge: -1
  });

  resp.status(200).json({
    message: 'User logged out successfully',
  });
};

module.exports = {
  getAllUsers,
  createUser,
  loginUser,
  logoutUser,
};
