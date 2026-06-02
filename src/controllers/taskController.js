import { parseFile } from '../services/parserService.js';
import { distributeTasks } from '../services/distributionService.js';
import Agent from '../models/agent.js';
import Task from '../models/task.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const uploadTasks = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a CSV or Excel file', 400);
  }

  try {
    const parsedRecords = await parseFile(req.file.buffer, req.file.originalname);
    const distributed = await distributeTasks(parsedRecords);

    return sendSuccess(res, 'File uploaded and tasks distributed successfully', {
      totalUploaded: parsedRecords.length,
      tasks: distributed
    });
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getTasksGrouped = async (req, res) => {
  try {
    const agents = await Agent.find().select('-password').sort({ name: 1 }).lean();
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();

    const grouped = agents.map(agent => {
      const agentTasks = tasks.filter(t => t.agentId.toString() === agent._id.toString());
      return {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile,
        tasks: agentTasks
      };
    });

    return sendSuccess(res, 'Grouped tasks fetched successfully', { grouped });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getStats = async (req, res) => {
  try {
    const totalAgents = await Agent.countDocuments();
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });
    const completedTasks = await Task.countDocuments({ status: 'Completed' });

    return sendSuccess(res, 'Stats fetched successfully', {
      totalAgents,
      totalTasks,
      pendingTasks,
      completedTasks
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};


export const completeTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { status: 'Completed' },
      { new: true }
    );

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    return sendSuccess(res, 'Task marked as completed', { task });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    return sendSuccess(res, 'Task deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

