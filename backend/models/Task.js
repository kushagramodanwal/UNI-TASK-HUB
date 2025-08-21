import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Task category is required'],
    enum: [
      'Academic Writing',
      'Programming',
      'Design',
      'Research',
      'Translation',
      'Data Analysis',
      'Presentation',
      'Other'
    ]
  },
  college: {
    type: String,
    required: [true, 'College is required'],
    trim: true,
    maxlength: [100, 'College name cannot exceed 100 characters']
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [1, 'Budget must be at least ₹1']
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Deadline must be today or in the future'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [500, 'Requirements cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'submitted', 'completed', 'cancelled', 'disputed'],
    default: 'open'
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  userEmail: {
    type: String,
    required: [true, 'User email is required']
  },
  userName: {
    type: String,
    required: [true, 'User name is required']
  },
  userCollege: {
    type: String,
    required: [true, 'User college is required'],
    trim: true,
    maxlength: [100, 'College name cannot exceed 100 characters']
  },
  assignedTo: {
    type: String,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  completedAt: {
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
  bidCount: {
    type: Number,
    default: 0
  },
  acceptedBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  submissionUrl: {
    type: String,
    default: null
  },
  submissionNotes: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  clientApprovedAt: {
    type: Date,
    default: null
  },
  disputeReason: {
    type: String,
    default: null
  },
  disputedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted deadline
taskSchema.virtual('formattedDeadline').get(function() {
  return this.deadline.toLocaleDateString();
});

// Virtual for time until deadline
taskSchema.virtual('timeUntilDeadline').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Index for better query performance
taskSchema.index({ category: 1, status: 1 });
taskSchema.index({ userId: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdAt: -1 });

// Pre-save middleware to update status based on deadline
taskSchema.pre('save', function(next) {
  if (this.deadline < new Date() && this.status === 'open') {
    this.status = 'cancelled';
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
