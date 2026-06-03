import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/user.js';
import fs from 'fs';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    await User.deleteMany({ email: 'admin@example.com' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      username: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword
    });

    console.log('Admin user seeded successfully (admin@example.com / admin123)');
    try {
      const serverPath = './src/server.js';
      if (fs.existsSync(serverPath)) {
        const now = new Date();
        fs.utimesSync(serverPath, now, now);
      }
    } catch (err) {
      console.warn('Failed to touch server.js to reload Bloom Filter:', err.message);
    }
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
