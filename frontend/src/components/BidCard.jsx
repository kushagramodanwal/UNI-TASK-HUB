import { useState } from 'react';

const BidCard = ({ bid, isTaskOwner = false, onAccept, onReject, onWithdraw, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
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
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {bid.freelancerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-white font-semibold">{bid.freelancerName}</h3>
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

      {/* Timestamps */}
      <div className="text-xs text-gray-500 mb-4">
        Submitted: {new Date(bid.createdAt).toLocaleDateString()} at {new Date(bid.createdAt).toLocaleTimeString()}
        {bid.acceptedAt && (
          <span className="ml-4">
            Accepted: {new Date(bid.acceptedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Actions */}
      {bid.status === 'pending' && (
        <div className="flex space-x-3">
          {isTaskOwner ? (
            <>
              <button
                onClick={() => onAccept && onAccept(bid._id)}
                disabled={isUpdating}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Accept Bid
              </button>
              <button
                onClick={() => onReject && onReject(bid._id)}
                disabled={isUpdating}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Reject Bid
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onUpdate && onUpdate(bid)}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Edit Bid
              </button>
              <button
                onClick={() => onWithdraw && onWithdraw(bid._id)}
                disabled={isUpdating}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Withdraw
              </button>
            </>
          )}
        </div>
      )}

      {bid.status === 'accepted' && !isTaskOwner && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-3">
          <div className="text-green-400 text-sm font-medium">🎉 Congratulations! Your bid was accepted.</div>
          <div className="text-green-300 text-xs mt-1">You can now start working on this task.</div>
        </div>
      )}

      {bid.status === 'rejected' && !isTaskOwner && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-3">
          <div className="text-red-400 text-sm font-medium">This bid was not selected.</div>
          <div className="text-red-300 text-xs mt-1">Keep applying to other tasks!</div>
        </div>
      )}
    </div>
  );
};

export default BidCard;
