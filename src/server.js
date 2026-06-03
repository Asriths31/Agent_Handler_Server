import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { runMigrations } from './utils/migration.js';
import { initUsernameFilter } from './utils/bloomFilter.js';

dotenv.config();

const startServer = async () => {
  await connectDB();
  await runMigrations();
  await initUsernameFilter();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
};

startServer();
