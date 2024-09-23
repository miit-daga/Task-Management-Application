const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      minlength: [4, 'Username must be at least 4 characters long'],
      required: [true, 'Please provide a username'],
      unique: [true, 'Username already taken'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: [true, 'Email already taken'],
      validate: {
        validator: validator.isEmail,
        message: 'Invalid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator(value) {
          // At least one uppercase letter, one lowercase letter, one digit, and one special character
          return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/g.test(value);
        },
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
      },
    },
  },
  {
    timestamps: true,
    collection: 'User',
  }
);

// eslint-disable-next-line func-names
userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
