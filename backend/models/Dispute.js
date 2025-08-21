import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: [true, 'Payment ID is required']
  },
  initiatorId: {
    type: String,
    required: [true, 'Initiator ID is required']
  },
  respondentId: {
    type: String,
    required: [true, 'Respondent ID is required']
  },
  reason: {
    type: String,
    required: [true, 'Dispute reason is required'],
    enum: [
      'work_not_delivered',
      'work_incomplete',
      'work_poor_quality',
      'requirements_not_met',
      'communication_issues',
      'deadline_missed',
      'payment_issue',
      'other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Dispute description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  resolution: {
    type: String,
    enum: ['refund_client', 'pay_freelancer', 'partial_refund', 'no_action'],
    default: null
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Resolution notes cannot exceed 500 characters']
  },
  adminId: {
    type: String,
    default: null
  },
  // Important dates
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  // Evidence and attachments
  evidence: [{
    type: {
      type: String,
      enum: ['text', 'image', 'document', 'link'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    filename: String,
    mimetype: String,
    size: Number,
    uploadedBy: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Communication thread
  messages: [{
    senderId: {
      type: String,
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    isAdminMessage: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Financial details
  disputeAmount: {
    type: Number,
    required: [true, 'Dispute amount is required'],
    min: [0, 'Dispute amount cannot be negative']
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  // Auto-close after certain period
  autoCloseAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for dispute age in days
disputeSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = now - created;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for time until auto-close
disputeSchema.virtual('daysUntilAutoClose').get(function() {
  if (!this.autoCloseAt) return null;
  const now = new Date();
  const autoClose = new Date(this.autoCloseAt);
  const diffTime = autoClose - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
});

// Index for better query performance
disputeSchema.index({ taskId: 1 });
disputeSchema.index({ paymentId: 1 });
disputeSchema.index({ initiatorId: 1 });
disputeSchema.index({ respondentId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ adminId: 1 });
disputeSchema.index({ createdAt: -1 });
disputeSchema.index({ autoCloseAt: 1 });

// Pre-save middleware to update task status when dispute is created
disputeSchema.post('save', async function() {
  if (this.isNew) {
    const Task = mongoose.model('Task');
    await Task.findByIdAndUpdate(this.taskId, {
      status: 'disputed',
      disputeReason: this.reason,
      disputedAt: this.createdAt
    });
  }
});

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
