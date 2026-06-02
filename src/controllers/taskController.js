import { parseFile } from '../services/parserService.js';
import { distributeTasks } from '../services/distributionService.js';
import Agent from '../models/agent.js';
import Task from '../models/task.js';
import { sendSuccess, sendError } from '../utils/response.js';
import xlsx from 'xlsx';

export const uploadTasks = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a CSV or Excel file', 400);
  }

  try {
    const parsedRecords = await parseFile(req.file.buffer, req.file.originalname);
    
    const errorsList = [];
    const validRecords = [];

    // Check batch and DB duplicates
    const seenPhonesInBatch = new Set();
    const batchPhones = parsedRecords.map(r => String(r.phone || '').trim()).filter(Boolean);
    const existingTasks = await Task.find({ phone: { $in: batchPhones } }).select('phone');
    const existingPhonesInDB = new Set(existingTasks.map(t => String(t.phone || '').trim()));

    parsedRecords.forEach((record, index) => {
      const rowErrors = [];
      const rowNumber = index + 2; // Header is row 1, first data row is 2

      if (!record.firstName) {
        rowErrors.push('FirstName is required');
      }
      if (!record.phone) {
        rowErrors.push('Phone is required');
      } else {
        const cleanPhone = String(record.phone).trim();
        if (!/^\d{10}$/.test(cleanPhone)) {
          rowErrors.push('Phone must be exactly 10 digits (numbers only)');
        } else {
          // Check DB duplicate
          if (existingPhonesInDB.has(cleanPhone)) {
            rowErrors.push('Duplicate phone number - task already exists in database');
          }
          // Check Batch duplicate
          else if (seenPhonesInBatch.has(cleanPhone)) {
            rowErrors.push('Duplicate phone number within upload batch');
          } else {
            seenPhonesInBatch.add(cleanPhone);
          }
        }
      }
      if (!record.notes) {
        rowErrors.push('Notes is required');
      }

      if (rowErrors.length > 0) {
        errorsList.push({
          'Row Number': rowNumber,
          'FirstName': record.firstName || '',
          'Phone': record.phone || '',
          'Notes': record.notes || '',
          'Errors': rowErrors.join(', ')
        });
      } else {
        validRecords.push(record);
      }
    });

    let distributed = [];
    if (validRecords.length > 0) {
      distributed = await distributeTasks(validRecords);
    }

    if (errorsList.length > 0) {
      const worksheet = xlsx.utils.json_to_sheet(errorsList);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Validation Errors');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=upload_errors.xlsx');
      res.setHeader('Access-Control-Expose-Headers', 'X-Error-File, X-Imported-Count, X-Error-Count');
      res.setHeader('X-Error-File', 'true');
      res.setHeader('X-Imported-Count', String(validRecords.length));
      res.setHeader('X-Error-Count', String(errorsList.length));
      return res.status(400).send(buffer);
    }

    return sendSuccess(res, 'File uploaded and tasks distributed successfully', {
      totalUploaded: validRecords.length,
      tasks: distributed
    });
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const downloadTemplate = async (req, res) => {
  try {
    const templateData = [
      { FirstName: 'John', Phone: '9876543210', Notes: 'Call in the evening' },
      { FirstName: 'Jane', Phone: '9123456789', Notes: 'Interested in product X' }
    ];

    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_template.xlsx');
    return res.send(buffer);
  } catch (error) {
    return sendError(res, error.message, 500);
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

