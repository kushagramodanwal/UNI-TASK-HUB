import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { taskAPI, bidAPI, enhancedTaskAPI } from "../utils/api.js";
import BidCard from "../components/BidCard.jsx";
import AnonymousBidCard from "../components/AnonymousBidCard.jsx";
import BidModal from "../components/BidModal.jsx";

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [submissionData, setSubmissionData] = useState({
    submissionUrl: '',
    submissionNotes: ''
  });
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskResponse, bidsResponse] = await Promise.all([
          taskAPI.getById(id),
          bidAPI.getForTask(id)
        ]);
        
        if (taskResponse.success) {
          setTask(taskResponse.data);
        }
        
        if (bidsResponse.success) {
          setBids(bidsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const fetchBids = async () => {
    setBidsLoading(true);
    try {
      const response = await bidAPI.getForTask(id);
      if (response.success) {
        setBids(response.data);
      }
    } catch (err) {
      console.error('Error fetching bids:', err);
    } finally {
      setBidsLoading(false);
    }
  };

  const isTaskOwner = user?.id === task?.userId;
  const isAssignedFreelancer = user?.id === task?.assignedTo;
  const userExistingBid = bids.find(bid => bid.freelancerId === user?.id);

  const handleSubmitBid = async (bidData) => {
    try {
      if (editingBid) {
        await bidAPI.update(editingBid._id, bidData);
      } else {
        await bidAPI.create(bidData);
      }
      setShowBidModal(false);
      setEditingBid(null);
      await fetchBids();
    } catch (err) {
      console.error('Error submitting bid:', err);
      alert('Error submitting bid. Please try again.');
    }
  };



  const handleWithdrawBid = async (bidId) => {
    if (!confirm('Are you sure you want to withdraw your bid?')) return;
    
    try {
      await bidAPI.withdraw(bidId);
      await fetchBids();
    } catch (err) {
      console.error('Error withdrawing bid:', err);
      alert('Error withdrawing bid. Please try again.');
    }
  };

  const handleEditBid = (bid) => {
    setEditingBid(bid);
    setShowBidModal(true);
  };

  const handleSubmitWork = async () => {
    if (!submissionData.submissionUrl.trim()) {
      alert('Please provide a submission URL');
      return;
    }

    try {
      await enhancedTaskAPI.submit(id, submissionData);
      setShowSubmissionModal(false);
      // Refresh task data
      const taskResponse = await taskAPI.getById(id);
      if (taskResponse.success) {
        setTask(taskResponse.data);
      }
    } catch (err) {
      console.error('Error submitting work:', err);
      alert('Error submitting work. Please try again.');
    }
  };

  const handleAssignTask = async (bidId) => {
    if (!window.confirm('Are you sure you want to assign this task to this junior?')) {
      return;
    }

    try {
      const response = await taskAPI.assignTask(id, { bidId });
      if (response.success) {
        setTask(response.data.task);
        // Refresh bids to get updated statuses
        fetchBids();
        alert('Task assigned successfully!');
      }
    } catch (err) {
      console.error('Error assigning task:', err);
      alert('Error assigning task. Please try again.');
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center text-white py-20">Loading...</div>;
  if (!task) return <div className="text-center text-gray-400 py-20">Task not found</div>;

  const getProgressStep = () => {
    switch (task.status) {
      case 'open': return 1;
      case 'assigned': return 2;
      case 'in-progress': return 3;
      case 'submitted': return 4;
      case 'completed': return 5;
      default: return 1;
    }
  };

  const currentStep = getProgressStep();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6">
      {/* Status bar */}
        <div className="flex justify-between mb-6">
          {["Posted", "Bids Open", "Task Assigned", "In Progress", "Completed"].map(
          (step, index) => (
            <div key={index} className="flex-1 text-center">
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    index < currentStep ? "bg-cyan-600 text-white" : "bg-gray-700 text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <p className="text-xs mt-2 text-gray-300">{step}</p>
            </div>
          )
        )}
      </div>

        {/* Title + Status */}
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-white">{task.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </div>

        <p className="text-gray-300 text-lg mb-6">{task.description}</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">₹{task.budget}</div>
            <div className="text-sm text-gray-400">Budget</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-lg font-semibold text-purple-400">{task.category}</div>
            <div className="text-sm text-gray-400">Category</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-lg font-semibold text-orange-400">
              {new Date(task.deadline).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-400">Deadline</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{task.bidCount || 0}</div>
            <div className="text-sm text-gray-400">Bids</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-lg font-semibold text-cyan-400">{task.college || 'University'}</div>
            <div className="text-sm text-gray-400">College</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-xl">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'details', label: 'Details' },
            { id: 'bids', label: `Bids (${bids.length})` },
            ...(isAssignedFreelancer && ['in-progress', 'submitted'].includes(task.status) 
              ? [{ id: 'work', label: 'Submit Work' }] : []),
            ...(isTaskOwner && task.status === 'submitted' 
              ? [{ id: 'review', label: 'Review Work' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Task Requirements</h3>
                {task.requirements ? (
                  <p className="text-gray-300 leading-relaxed">{task.requirements}</p>
                ) : (
                  <p className="text-gray-400 italic">No specific requirements provided.</p>
                )}
              </div>

              {task.location && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Location</h3>
                  <p className="text-gray-300">{task.location}</p>
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">College/University</h3>
                <p className="text-gray-300">{task.college || 'Not specified'}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Posted</h3>
                <p className="text-gray-300">
                  {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Submission Details */}
              {task.status === 'submitted' && task.submissionUrl && (
                <div className="bg-purple-900 border border-purple-700 rounded-lg p-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Work Submitted</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400">Submission URL: </span>
                      <a 
                        href={task.submissionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {task.submissionUrl}
                      </a>
                    </div>
                    {task.submissionNotes && (
                      <div>
                        <span className="text-gray-400">Notes: </span>
                        <span className="text-gray-300">{task.submissionNotes}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Submitted: </span>
                      <span className="text-gray-300">
                        {new Date(task.submittedAt).toLocaleDateString()} at {new Date(task.submittedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Bids ({bids.length})
                </h3>
                
                {/* Bid Actions */}
                {user && !isTaskOwner && task.status === 'open' && (
                  <div className="space-x-3">
                    {userExistingBid ? (
                      <>
                        {userExistingBid.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEditBid(userExistingBid)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                            >
                              Edit Bid
                            </button>
                            <button
                              onClick={() => handleWithdrawBid(userExistingBid._id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                            >
                              Withdraw Bid
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setShowBidModal(true)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Place Bid
                      </button>
                    )}
                  </div>
                )}
              </div>

              {bidsLoading ? (
                <div className="text-center text-gray-400 py-8">Loading bids...</div>
              ) : bids.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No bids yet. {!isTaskOwner && task.status === 'open' && 'Be the first to bid!'}
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map(bid => (
                    <div key={bid._id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {bid.freelancerName?.charAt(0).toUpperCase() || 'F'}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {bid.freelancerName}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {new Date(bid.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-400">₹{bid.amount}</div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2">Proposal</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{bid.proposal}</p>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                        <span>Delivery: {bid.deliveryTime} days</span>
                        <span>Status: <span className={`font-semibold ${
                          bid.status === 'accepted' ? 'text-green-400' :
                          bid.status === 'rejected' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </span></span>
                      </div>

                      {/* Show assignment button only for task owner when task is open */}
                      {isTaskOwner && task.status === 'open' && bid.status === 'pending' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleAssignTask(bid._id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                          >
                            ✅ Assign Task to This Junior
                          </button>
                        </div>
                      )}

                      {/* Show assigned status when bid is accepted */}
                      {bid.status === 'accepted' && (
                        <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded-lg">
                          <div className="text-green-400 text-sm font-medium">✅ Task Assigned</div>
                          <div className="text-green-300 text-xs mt-1">
                            This junior has been assigned to complete the task.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'work' && isAssignedFreelancer && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Work Management</h3>
              
              {task.status === 'assigned' ? (
                <div className="space-y-4">
                  <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-4">
                    <div className="text-yellow-400 text-lg mb-2">🎯 Task Assigned!</div>
                    <p className="text-yellow-300 text-sm">
                      You have been assigned to complete this task. Click "Start Working" to begin.
                    </p>
                  </div>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Update task status to in-progress
                        const response = await taskAPI.update(id, { status: 'in-progress' });
                        if (response.success) {
                          setTask(response.data);
                        }
                      } catch (err) {
                        console.error('Error starting work:', err);
                        alert('Error starting work. Please try again.');
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    🚀 Start Working
                  </button>
                </div>
              ) : task.status === 'in-progress' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Submission URL *
                    </label>
                    <input
                      type="url"
                      value={submissionData.submissionUrl}
                      onChange={(e) => setSubmissionData(prev => ({ ...prev, submissionUrl: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={submissionData.submissionNotes}
                      onChange={(e) => setSubmissionData(prev => ({ ...prev, submissionNotes: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      rows="4"
                      placeholder="Any additional notes about your submission..."
                    />
                  </div>
                  
                  <button
                    onClick={handleSubmitWork}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Submit Work
                  </button>
                </div>
              ) : (
                <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                  <p className="text-blue-300">
                    Work has already been submitted. Waiting for client review.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'review' && isTaskOwner && task.status === 'submitted' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Review Submitted Work</h3>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400">Submission URL: </span>
                    <a 
                      href={task.submissionUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      {task.submissionUrl}
                    </a>
                  </div>
                  
                  {task.submissionNotes && (
                    <div>
                      <span className="text-gray-400">Notes: </span>
                      <span className="text-gray-300">{task.submissionNotes}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={async () => {
                      try {
                        // Approve work and mark as completed
                        const response = await taskAPI.update(id, { status: 'completed' });
                        if (response.success) {
                          setTask(response.data);
                          alert('Work approved! Task marked as completed.');
                        }
                      } catch (err) {
                        console.error('Error approving work:', err);
                        alert('Error approving work. Please try again.');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    ✅ Approve Work
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Reject work and reset to assigned status
                        const response = await taskAPI.update(id, { status: 'assigned' });
                        if (response.success) {
                          setTask(response.data);
                          alert('Work rejected. Task reset to assigned status.');
                        }
                      } catch (err) {
                        console.error('Error rejecting work:', err);
                        alert('Error rejecting work. Please try again.');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    ❌ Request Revision
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task Assignment Status - Show when task is assigned */}
          {task.acceptedBidId && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Task Assignment</h3>
              
              <div className="bg-green-900 border border-green-700 rounded-lg p-4 text-center">
                <div className="text-green-400 text-2xl mb-2">✅</div>
                <h4 className="text-green-400 font-medium mb-2">Task Assigned!</h4>
                <p className="text-green-300 text-sm">
                  This task has been assigned to a junior. They can now start working on it.
                </p>
              </div>
              
              {task.assignedTo && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Assigned Junior</h4>
                  <div className="text-gray-300 text-sm">
                    <p><strong>Name:</strong> {bids.find(b => b._id === task.acceptedBidId)?.freelancerName || 'Unknown'}</p>
                    <p><strong>Email:</strong> {bids.find(b => b._id === task.acceptedBidId)?.freelancerEmail || 'Unknown'}</p>
                    <p><strong>Assigned Date:</strong> {new Date(task.assignedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/browse-tasks")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            ← Back to Tasks
          </button>
        </div>
      </div>

      {/* Modals */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => {
          setShowBidModal(false);
          setEditingBid(null);
        }}
        onSubmit={handleSubmitBid}
        task={task}
        existingBid={editingBid}
      />
    </div>
  );
};

export default TaskDetails;