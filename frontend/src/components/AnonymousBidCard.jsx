import { useState } from 'react';

const AnonymousBidCard = ({ bid, isTaskOwner = false, isAcceptedBidder = false, onAccept, onReject }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatDeliveryTime = (days) => {
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
    return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const handleAcceptBid = async () => {
    setIsAccepting(true);
    try {
      await onAccept(bid._id);
    } finally {
      setIsAccepting(false);
    }
  };

  // Determine if user info should be revealed
  const isInfoRevealed = bid.status === 'accepted';
  
  // Determine what content to show based on bid status and user role
  const shouldShowBidDetails = isAcceptedBidder || isTaskOwner;
  const shouldShowCompletedStatus = !shouldShowBidDetails && bid.status === 'accepted';

  // Show completed/closed status for non-authorized users
  if (shouldShowCompletedStatus) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-white mb-2">Task Completed</h3>
          <p className="text-gray-400">This task has been completed and payment has been processed.</p>
        </div>
      </div>
    );
  }

  // Show closed status for non-authorized users when task is not completed
  if (!shouldShowBidDetails && bid.status !== 'pending') {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-white mb-2">Task Closed</h3>
          <p className="text-gray-400">This task is no longer accepting bids.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {isInfoRevealed ? bid.freelancerName.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {isInfoRevealed ? bid.freelancerName : 'Anonymous Bidder'}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{getRatingStars(bid.freelancerRating || 0)}</span>
              <span>({bid.freelancerRating || 0}/5)</span>
              <span>•</span>
              <span>{bid.freelancerCompletedTasks || 0} completed tasks</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
        </span>
      </div>

      {/* Contact Information - Only shown when bid is accepted */}
      {isInfoRevealed && (
        <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
          <h4 className="text-green-400 font-medium mb-2">📞 Contact Information Revealed</h4>
          <div className="space-y-1 text-sm">
            <div className="text-gray-300">
              <span className="text-gray-400">Email:</span> {bid.freelancerEmail}
            </div>
            {bid.freelancerPhone && (
              <div className="text-gray-300">
                <span className="text-gray-400">Phone:</span> {bid.freelancerPhone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bid Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-400">₹{bid.amount}</div>
          <div className="text-sm text-gray-400">Bid Amount</div>
        </div>
        <div className="bg-gray-900 p-3 rounded-lg">
          <div className="text-lg font-semibold text-blue-400">{formatDeliveryTime(bid.deliveryTime)}</div>
          <div className="text-sm text-gray-400">Delivery Time</div>
        </div>
      </div>

      {/* Proposal Preview */}
      <div className="mb-4">
        <h4 className="text-white font-medium mb-2">Proposal</h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          {showDetails ? bid.proposal : bid.proposal.slice(0, 150) + (bid.proposal.length > 150 ? '...' : '')}
        </p>
        {bid.proposal.length > 150 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-cyan-400 text-sm mt-2 hover:text-cyan-300"
          >
            {showDetails ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Anonymous Notice */}
      {!isInfoRevealed && (
        <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
          <div className="text-blue-400 text-sm font-medium">🔒 Anonymous Bid</div>
          <div className="text-blue-300 text-xs mt-1">
            Bidder's contact information will be revealed when you accept this bid.
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 mb-4">
        Submitted: {new Date(bid.createdAt).toLocaleDateString()} at {new Date(bid.createdAt).toLocaleTimeString()}
        {bid.acceptedAt && (
          <span className="ml-4 text-green-400">
            Accepted: {new Date(bid.acceptedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Actions */}
      {bid.status === 'pending' && isTaskOwner && (
        <div className="flex space-x-3">
          <button
            onClick={handleAcceptBid}
            disabled={isAccepting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isAccepting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accepting...
              </>
            ) : (
              '✓ Accept Bid & Reveal Info'
            )}
          </button>
          <button
            onClick={() => onReject && onReject(bid._id)}
            disabled={isAccepting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ✗ Reject Bid
          </button>
        </div>
      )}

      {bid.status === 'accepted' && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-3">
          <div className="text-green-400 text-sm font-medium">✅ Bid Accepted</div>
          <div className="text-green-300 text-xs mt-1">
            Contact information has been revealed. You can now communicate directly with the freelancer.
          </div>
        </div>
      )}

      {bid.status === 'rejected' && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-3">
          <div className="text-red-400 text-sm font-medium">❌ Bid Rejected</div>
          <div className="text-red-300 text-xs mt-1">This bid was not selected for this task.</div>
        </div>
      )}
    </div>
  );
};

export default AnonymousBidCard;
