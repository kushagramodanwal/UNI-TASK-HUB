import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  freelancerId: {
    type: String,
    required: [true, 'Freelancer ID is required']
  },
  freelancerEmail: {
    type: String,
    required: [true, 'Freelancer email is required']
  },
  freelancerName: {
    type: String,
    required: [true, 'Freelancer name is required']
  },
  freelancerPhone: {
    type: String,
    required: [true, 'Freelancer phone is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [1, 'Bid amount must be at least ₹1']
  },
  proposal: {
    type: String,
    required: [true, 'Proposal is required'],
    trim: true,
    maxlength: [1000, 'Proposal cannot exceed 1000 characters']
  },
  deliveryTime: {
    type: Number,
    required: [true, 'Delivery time is required'],
    min: [1, 'Delivery time must be at least 1 day']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  withdrawnAt: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  // Additional freelancer information at time of bid
  freelancerRating: {
    type: Number,
    default: 0
  },
  freelancerCompletedTasks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted delivery time
bidSchema.virtual('formattedDeliveryTime').get(function() {
  const days = this.deliveryTime;
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
});

// Index for better query performance
bidSchema.index({ taskId: 1 });
bidSchema.index({ freelancerId: 1 });
bidSchema.index({ status: 1 });
bidSchema.index({ amount: 1 });
bidSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate bids from same freelancer on same task
bidSchema.index({ taskId: 1, freelancerId: 1 }, { unique: true });

// Pre-save middleware to update bid count on task
bidSchema.post('save', async function() {
  if (this.isNew) {
    const Task = mongoose.model('Task');
    await Task.findByIdAndUpdate(this.taskId, {
      $inc: { bidCount: 1 }
    });
  }
});

// Post-remove middleware to decrease bid count on task
bidSchema.post('deleteOne', { document: true, query: false }, async function() {
  const Task = mongoose.model('Task');
  await Task.findByIdAndUpdate(this.taskId, {
    $inc: { bidCount: -1 }
  });
});

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
