import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import User from '../models/user.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return sendError(res, 'User not found or unauthorized', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      return sendError(res, 'Not authorized, token failed', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }
};

export default protect;
