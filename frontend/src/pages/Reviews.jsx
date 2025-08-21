import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { reviewAPI } from '../utils/api.js';

const Reviews = () => {
  const { isSignedIn, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewAPI.getAll();
        if (response.success) {
          setReviews(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchReviews();
  }, []);

  // Submit new review
  const handleAddReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const reviewData = {
        rating: newReview.rating,
        comment: newReview.comment
      };
      
      const response = await reviewAPI.create(reviewData);
      if (response.success) {
        setReviews(prev => [response.data, ...prev]);
        setNewReview({ rating: 5, comment: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (review) => console.log('Editing review:', review);

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const response = await reviewAPI.delete(reviewId);
        if (response.success) {
          setReviews(prev => prev.filter(r => r._id !== reviewId));
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-500'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reviews</h1>
          <p className="text-gray-400">
            See what others are saying about their experiences on UNI TASK HUB.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6 flex flex-col items-center gap-4">
          <div className="flex gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{averageRating}</div>
              <div className="flex justify-center mt-1 gap-1">{renderStars(averageRating)}</div>
              <div className="text-gray-400 text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{reviews.length}</div>
              <div className="text-gray-400 text-sm">Total Reviews</div>
            </div>
          </div>
          {isSignedIn && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Add Review
            </button>
          )}
        </div>

        {/* Add Review Form */}
        {showAddForm && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Add Your Review</h3>
            <form onSubmit={handleAddReview} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-gray-200 font-medium mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-500'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-gray-200 font-medium mb-1">Your Review</label>
                <textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Share your experience with UNI TASK HUB..."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="flex flex-col gap-4">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review._id} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.reviewerName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {review.reviewerName || 'Anonymous'}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                {isSignedIn && review.reviewerId === user?.id && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="mb-4 text-lg text-gray-400">No reviews yet. Be the first to share your experience!</p>
              {isSignedIn && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Add First Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
