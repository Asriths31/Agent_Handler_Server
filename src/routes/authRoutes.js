import express from 'express';
import { login, register, logout, checkUsername } from '../controllers/authController.js';

const router = express.Router();

router.get('/check-username', checkUsername);
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

export default router;

