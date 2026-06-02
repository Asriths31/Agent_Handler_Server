import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;
