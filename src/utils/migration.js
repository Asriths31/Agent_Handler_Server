import User from '../models/user.js';
import Agent from '../models/agent.js';
import Task from '../models/task.js';

export const runMigrations = async () => {
  try {
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      console.log('Migration skipped: default admin user admin@example.com not found. Run seed script first.');
      return;
    }

    const adminId = admin._id;

    // Update Agents with missing userId
    const agentsResult = await Agent.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: adminId } }
    );

    if (agentsResult.modifiedCount > 0) {
      console.log(`Migration: Updated ${agentsResult.modifiedCount} agents to belong to admin.`);
    }

    // Update Tasks with missing userId
    const tasksResult = await Task.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: adminId } }
    );

    if (tasksResult.modifiedCount > 0) {
      console.log(`Migration: Updated ${tasksResult.modifiedCount} tasks to belong to admin.`);
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
};
