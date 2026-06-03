import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    }

  },
  {
    timestamps: true
  }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
