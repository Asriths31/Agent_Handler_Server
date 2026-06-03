import Agent from '../models/agent.js';
import Task from '../models/task.js';

export const distributeTasks = async (parsedRecords, userId) => {
  const agents = await Agent.find({ userId }).sort({ createdAt: 1 });
  if (agents.length === 0) {
    throw new Error('No agents available. Please add at least one agent before distributing tasks.');
  }

  const tasksToCreate = parsedRecords.map((record, index) => {
    const assignedAgent = agents[index % agents.length];
    return {
      firstName: record.firstName,
      phone: record.phone,
      notes: record.notes,
      agentId: assignedAgent._id,
      userId
    };
  });

  const createdTasks = await Task.insertMany(tasksToCreate);
  return createdTasks;
};
