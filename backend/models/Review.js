import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  reviewerId: {
    type: String,
    required: [true, 'Reviewer ID is required']
  },
  reviewerEmail: {
    type: String,
    required: [true, 'Reviewer email is required']
  },
  reviewerName: {
    type: String,
    required: [true, 'Reviewer name is required']
  },
  reviewerImage: {
    type: String,
    default: null
  },
  revieweeId: {
    type: String,
    required: [true, 'Reviewee ID is required']
  },
  revieweeEmail: {
    type: String,
    required: [true, 'Reviewee email is required']
  },
  revieweeName: {
    type: String,
    required: [true, 'Reviewee name is required']
  },
  reviewType: {
    type: String,
    enum: ['client_to_freelancer', 'freelancer_to_client'],
    required: [true, 'Review type is required']
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

reviewSchema.index({ taskId: 1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ revieweeId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ reviewType: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ taskId: 1, reviewerId: 1 }, { unique: true });

reviewSchema.pre('save', async function(next) {
  try {
    if (this.reviewerId === this.revieweeId) {
      throw new Error('Cannot review yourself');
    }
    
    const Task = mongoose.model('Task');
    const task = await Task.findById(this.taskId);
   
    if (!task) {
      throw new Error('Task not found');
    }
   
    if (this.reviewType === 'client_to_freelancer') {
      if (task.userId !== this.reviewerId) {
        throw new Error('Only the task client can review the freelancer');
      }
    } else if (this.reviewType === 'freelancer_to_client') {
      if (task.assignedTo !== this.reviewerId) {
        throw new Error('Only the assigned freelancer can review the client');
      }
    }
   
    next();
  } catch (error) {
    next(error);
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
