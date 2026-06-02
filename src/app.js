import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      let [name, ...rest] = cookie.split('=');
      name = name.trim();
      if (name) {
        const value = rest.join('=').trim();
        req.cookies[name] = decodeURIComponent(value);
      }
    });
  }
  next();
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

export default app;
