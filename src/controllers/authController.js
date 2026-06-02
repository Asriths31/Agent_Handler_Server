import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { sendSuccess, sendError } from '../utils/response.js';

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

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Please provide email and password', 400);
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword
    });

    return sendSuccess(res, 'Registration successful', {
      user: {
        id: user._id,
        email: user.email
      }
    }, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

