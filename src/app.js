import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();

app.use(cors());
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
