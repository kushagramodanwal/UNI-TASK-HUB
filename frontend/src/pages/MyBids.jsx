import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bidAPI } from '../utils/api.js';
import BidCard from '../components/BidCard.jsx';

const MyBids = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchBids();
  }, [filter, sortBy, sortOrder]);

  const fetchBids = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      const response = await bidAPI.getMyBids(filters);
      if (response.success) {
        setBids(response.data);
      }
    } catch (err) {
      console.error('Error fetching bids:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawBid = async (bidId) => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return;
    
    try {
      await bidAPI.withdraw(bidId);
      await fetchBids();
    } catch (err) {
      console.error('Error withdrawing bid:', err);
      alert('Error withdrawing bid. Please try again.');
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Bids' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'amount', label: 'Bid Amount' },
    { value: 'status', label: 'Status' }
  ];

  const getStatusStats = () => {
    const stats = {
      total: bids.length,
      pending: bids.filter(bid => bid.status === 'pending').length,
      accepted: bids.filter(bid => bid.status === 'accepted').length,
      rejected: bids.filter(bid => bid.status === 'rejected').length,
      withdrawn: bids.filter(bid => bid.status === 'withdrawn').length
    };

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">My Bids</h1>
          <button
            onClick={() => navigate('/browse-tasks')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Browse Tasks
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Bids</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
            <div className="text-sm text-gray-400">Accepted</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-sm text-gray-400">Rejected</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.withdrawn}</div>
            <div className="text-sm text-gray-400">Withdrawn</div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-white font-medium">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-white font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-white font-medium">Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bids List */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          {filter === 'all' ? 'All Bids' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bids`}
          {bids.length > 0 && ` (${bids.length})`}
        </h2>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading bids...</div>
        ) : bids.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No bids found</h3>
            <p className="mb-6">
              {filter === 'all' 
                ? "You haven't placed any bids yet." 
                : `No ${filter} bids found.`
              }
            </p>
            <button
              onClick={() => navigate('/browse-tasks')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Browse Tasks to Bid
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bids.map(bid => (
              <div key={bid._id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                {/* Task Info */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="text-xl font-semibold text-white cursor-pointer hover:text-cyan-400"
                      onClick={() => navigate(`/task/${bid.taskId._id}`)}
                    >
                      {bid.taskId?.title || 'Task Title Not Available'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                    <span>Category: {bid.taskId?.category || 'N/A'}</span>
                    <span>•</span>
                    <span>Budget: ₹{bid.taskId?.budget || 0}</span>
                    <span>•</span>
                    <span>Deadline: {bid.taskId?.deadline ? new Date(bid.taskId.deadline).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Anonymous Status Indicator */}
                {bid.status === 'pending' && (
                  <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                    <div className="text-blue-400 text-sm font-medium">🔒 Anonymous Bid</div>
                    <div className="text-blue-300 text-xs mt-1">
                      Your contact information is hidden until the client accepts your bid.
                    </div>
                  </div>
                )}

                {bid.status === 'accepted' && (
                  <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
                    <div className="text-green-400 text-sm font-medium">✅ Contact Info Revealed</div>
                    <div className="text-green-300 text-xs mt-1">
                      Your contact information has been shared with the client.
                    </div>
                  </div>
                )}

                {/* Bid Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-900 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">₹{bid.amount}</div>
                    <div className="text-sm text-gray-400">Your Bid</div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-blue-400">
                      {bid.deliveryTime} {bid.deliveryTime === 1 ? 'day' : 'days'}
                    </div>
                    <div className="text-sm text-gray-400">Delivery Time</div>
                  </div>
                </div>

                {/* Proposal Preview */}
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">Your Proposal</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {bid.proposal.slice(0, 200)}{bid.proposal.length > 200 ? '...' : ''}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 mb-4">
                  Submitted: {new Date(bid.createdAt).toLocaleDateString()} at {new Date(bid.createdAt).toLocaleTimeString()}
                  {bid.acceptedAt && (
                    <span className="ml-4 text-green-400">
                      Accepted: {new Date(bid.acceptedAt).toLocaleDateString()}
                    </span>
                  )}
                  {bid.rejectedAt && (
                    <span className="ml-4 text-red-400">
                      Rejected: {new Date(bid.rejectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/task/${bid.taskId._id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    View Task
                  </button>
                  
                  {bid.status === 'pending' && (
                    <button
                      onClick={() => handleWithdrawBid(bid._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Withdraw Bid
                    </button>
                  )}

                  {bid.status === 'accepted' && (
                    <div className="bg-green-900 border border-green-700 rounded-lg px-4 py-2 flex items-center">
                      <span className="text-green-400 text-sm font-medium">
                        🎉 Congratulations! Start working on this task.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBids;
