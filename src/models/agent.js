import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
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

agentSchema.index({ email: 1, userId: 1 }, { unique: true });

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;
