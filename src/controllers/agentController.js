import bcrypt from 'bcryptjs';
import Agent from '../models/agent.js';
import Task from '../models/task.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const addAgent = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !mobile || !password) {
    return sendError(res, 'All fields are required', 400);
  }

  try {
    const agentExists = await Agent.findOne({ email });
    if (agentExists) {
      return sendError(res, 'An agent with this email already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = await Agent.create({
      name,
      email,
      mobile,
      password: hashedPassword
    });

    return sendSuccess(res, 'Agent created successfully', {
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile
      }
    }, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find().select('-password').sort({ createdAt: -1 });
    return sendSuccess(res, 'Agents fetched successfully', { agents });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateAgent = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !mobile) {
    return sendError(res, 'Name, email, and mobile are required', 400);
  }

  try {
    const agent = await Agent.findById(id);
    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    const emailExists = await Agent.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      return sendError(res, 'An agent with this email already exists', 400);
    }

    agent.name = name;
    agent.email = email;
    agent.mobile = mobile;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      agent.password = await bcrypt.hash(password, salt);
    }

    await agent.save();

    return sendSuccess(res, 'Agent updated successfully', {
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobile: agent.mobile
      }
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteAgent = async (req, res) => {
  const { id } = req.params;

  try {
    const agent = await Agent.findByIdAndDelete(id);
    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    await Task.deleteMany({ agentId: id });

    return sendSuccess(res, 'Agent and their assigned tasks deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

