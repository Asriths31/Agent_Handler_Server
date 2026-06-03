import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { addUsernameToFilter, checkUsernameExists } from '../utils/bloomFilter.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Please provide email and password', 400);
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0)
  });
  return sendSuccess(res, 'Logged out successfully');
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return sendError(res, 'Please provide username, email and password', 400);
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    addUsernameToFilter(username);

    return sendSuccess(res, 'Registration successful', {
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    }, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const checkUsername = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return sendError(res, 'Username query parameter is required', 400);
  }

  try {
    const exists = await checkUsernameExists(username);
    return sendSuccess(res, 'Username checked successfully', { available: !exists });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};


