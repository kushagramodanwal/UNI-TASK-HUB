import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { taskAPI, bidAPI, enhancedTaskAPI, reviewAPI } from "../utils/api.js";
import BidModal from "../components/BidModal.jsx";

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [showBidModal, setShowBidModal] = useState(false);
  const [editingBid, setEditingBid] = useState(null);

  const [activeTab, setActiveTab] = useState("details");

  const [submissionData, setSubmissionData] = useState({
    submissionUrl: "",
    submissionNotes: "",
  });

  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
  });

  // ✅ Fetch task + bids + reviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("TaskDetails: id param is", id);
        const [taskResponse, bidsResponse, reviewsResponse] = await Promise.all([
          taskAPI.getById(id),
          bidAPI.getForTask(id),
          reviewAPI.getAll({ taskId: id }),
        ]);
        console.log("TaskDetails: taskResponse is", taskResponse);

        // Accept both wrapped and direct responses
        if (taskResponse?.success && taskResponse.data) {
          setTask(taskResponse.data);
        } else if (taskResponse?._id) {
          setTask(taskResponse);
        } else {
          setTask(null);
        }
        if (bidsResponse?.success) setBids(bidsResponse.data);
        if (reviewsResponse?.success) setReviews(reviewsResponse.data);
      } catch (err) {
        console.error("Error fetching task details:", err);
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ✅ Fetch only bids
  const fetchBids = useCallback(async () => {
    setBidsLoading(true);
    try {
      const response = await bidAPI.getForTask(id);
      if (response.success) setBids(response.data);
    } catch (err) {
      console.error("Error fetching bids:", err);
    } finally {
      setBidsLoading(false);
    }
  }, [id]);

  // ✅ Fetch only reviews
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const response = await reviewAPI.getAll({ taskId: id });
      if (response.success) setReviews(response.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  // Helpers
  const isTaskOwner = user?.id && user?.id === task?.userId;
  const isAssignedFreelancer = user?.id && user?.id === task?.assignedTo;
  const userExistingBid = bids.find((bid) => bid.freelancerId === user?.id);
  const canBid = !isTaskOwner && task?.status === "open" && !userExistingBid;
  const canSubmitWork = isAssignedFreelancer && task?.status === "in-progress";
  const canReview = (isTaskOwner || isAssignedFreelancer) && task?.status === "completed";

  // ✅ Submit Bid
  const handleSubmitBid = async (bidData) => {
    try {
      if (editingBid) {
        await bidAPI.update(editingBid._id, bidData);
      } else {
        await bidAPI.create({ ...bidData, taskId: id });
      }
      setShowBidModal(false);
      setEditingBid(null);
      fetchBids();
    } catch (err) {
      console.error("Error submitting bid:", err);
      alert("Error submitting bid. Please try again.");
    }
  };

  // ✅ Withdraw Bid
  const handleWithdrawBid = async (bidId) => {
    if (!window.confirm("Are you sure you want to withdraw your bid?")) return;

    try {
      await bidAPI.withdraw(bidId);
      fetchBids();
    } catch (err) {
      console.error("Error withdrawing bid:", err);
      alert("Error withdrawing bid. Please try again.");
    }
  };

  // ✅ Submit Work
  const handleSubmitWork = async () => {
    if (!submissionData.submissionUrl.trim()) {
      alert("Please provide a submission URL");
      return;
    }

    try {
      await enhancedTaskAPI.submit(id, submissionData);
      const taskResponse = await taskAPI.getById(id);
      if (taskResponse.success) setTask(taskResponse.data);
      setSubmissionData({ submissionUrl: "", submissionNotes: "" });
      alert("Work submitted successfully!");
    } catch (err) {
      console.error("Error submitting work:", err);
      alert("Error submitting work. Please try again.");
    }
  };

  // ✅ Assign Task
  const handleAssignTask = async (bidId) => {
    if (!window.confirm("Assign this task to this freelancer?")) return;

    try {
      const response = await taskAPI.assignTask(id, { bidId });
      if (response.success) {
        setTask(response.data.task);
        fetchBids();
        alert("Task assigned successfully!");
      }
    } catch (err) {
      console.error("Error assigning task:", err);
      alert("Error assigning task. Please try again.");
    }
  };

  // ✅ Submit Review
  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      alert("Please provide a review comment");
      return;
    }

    try {
      await reviewAPI.create({
        taskId: id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewerId: user.id,
        revieweeId: isTaskOwner ? task.assignedTo : task.userId,
      });
      setReviewData({ rating: 5, comment: "" });
      fetchReviews();
      alert("Review submitted successfully!");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Error submitting review. Please try again.");
    }
  };

  // ✅ Task Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "submitted":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center text-white py-20">Loading...</div>;
  }

  if (!task) {
    return <div className="text-center text-gray-400 py-20">Task not found</div>;
  }

  // ✅ Progress Step
  const getProgressStep = () => {
    switch (task.status) {
      case "open":
        return 1;
      case "assigned":
        return 2;
      case "in-progress":
        return 3;
      case "submitted":
        return 4;
      case "completed":
        return 5;
      default:
        return 1;
    }
  };

  const currentStep = getProgressStep();

  // Tab content components
  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Task Description</h3>
        <p className="text-gray-300 leading-relaxed">{task.description}</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Task Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400">Category:</span>
            <p className="text-white font-medium">{task.category}</p>
          </div>
          <div>
            <span className="text-gray-400">Budget:</span>
            <p className="text-white font-medium">₹{task.budget}</p>
          </div>
          <div>
            <span className="text-gray-400">Deadline:</span>
            <p className="text-white font-medium">
              {new Date(task.deadline).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-400">College:</span>
            <p className="text-white font-medium">{task.college || "Not specified"}</p>
          </div>
        </div>
      </div>

      {task.requirements && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Requirements</h3>
          <p className="text-gray-300">{task.requirements}</p>
        </div>
      )}
    </div>
  );

  const renderBidsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Bids ({bids.length})</h3>
        {canBid && (
          <button
            onClick={() => setShowBidModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Submit Bid
          </button>
        )}
      </div>

      {bidsLoading ? (
        <div className="text-center text-gray-400 py-8">Loading bids...</div>
      ) : bids.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No bids yet</div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-medium">₹{bid.amount}</p>
                  <p className="text-gray-400 text-sm">
                    Estimated time: {bid.estimatedTime} days
                  </p>
                  {bid.notes && (
                    <p className="text-gray-300 text-sm mt-2">{bid.notes}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {isTaskOwner && task.status === "open" && (
                    <button
                      onClick={() => handleAssignTask(bid._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Assign
                    </button>
                  )}
                  {bid.freelancerId === user?.id && (
                    <button
                      onClick={() => handleWithdrawBid(bid._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWorkSubmissionTab = () => (
    <div className="space-y-6">
      {canSubmitWork ? (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Submit Work</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Submission URL
              </label>
              <input
                type="url"
                value={submissionData.submissionUrl}
                onChange={(e) =>
                  setSubmissionData({ ...submissionData, submissionUrl: e.target.value })
                }
                placeholder="https://example.com/submission"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">
                Additional Notes
              </label>
              <textarea
                value={submissionData.submissionNotes}
                onChange={(e) =>
                  setSubmissionData({ ...submissionData, submissionNotes: e.target.value })
                }
                placeholder="Any additional notes about your submission..."
                rows="3"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handleSubmitWork}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Submit Work
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          {task.status === "in-progress"
            ? "Only the assigned freelancer can submit work"
            : "Work submission is not available for this task status"}
        </div>
      )}
    </div>
  );

  const renderReviewsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Reviews ({reviews.length})</h3>
        {canReview && (
          <button
            onClick={() => setActiveTab("submit-review")}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Submit Review
          </button>
        )}
      </div>

      {reviewsLoading ? (
        <div className="text-center text-gray-400 py-8">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No reviews yet</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < review.rating ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-300">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubmitReviewTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Submit Review</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setReviewData({ ...reviewData, rating })}
                  className={`text-2xl ${
                    rating <= reviewData.rating ? "text-yellow-400" : "text-gray-400"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Comment</label>
            <textarea
              value={reviewData.comment}
              onChange={(e) =>
                setReviewData({ ...reviewData, comment: e.target.value })
              }
              placeholder="Share your experience with this task..."
              rows="4"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSubmitReview}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Submit Review
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gray-900 rounded-xl p-6">
        {/* Progress Tracker */}
        <div className="flex justify-between mb-6">
          {["Posted", "Bids Open", "Task Assigned", "In Progress", "Completed"].map(
            (step, index) => (
              <div key={index} className="flex-1 text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-700 text-gray-400"
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
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              task.status
            )}`}
          >
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="bg-gray-900 rounded-xl p-6">
        <button
          onClick={() => navigate("/browse-tasks")}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          ← Back to Tasks
        </button>
      </div>

      {/* TABS */}
      <div className="bg-gray-900 rounded-xl">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "details", label: "Details" },
              { id: "bids", label: `Bids (${bids.length})` },
              { id: "work-submission", label: "Work Submission" },
              { id: "reviews", label: `Reviews (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "bids" && renderBidsTab()}
          {activeTab === "work-submission" && renderWorkSubmissionTab()}
          {activeTab === "reviews" && renderReviewsTab()}
          {activeTab === "submit-review" && renderSubmitReviewTab()}
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => {existingBid={editingBid}
          setShowBidModal(false);
          setEditingBid(null);</div>
        }});
        onSubmit={handleSubmitBid}};
        task={task}
      />export default TaskDetails;






export default TaskDetails;};  );    </div>