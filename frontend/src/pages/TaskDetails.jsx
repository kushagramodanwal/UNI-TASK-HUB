import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { taskAPI, bidAPI, enhancedTaskAPI } from "../utils/api.js";
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

  const [activeTab, setActiveTab] = useState("details");

  const [submissionData, setSubmissionData] = useState({
    submissionUrl: "",
    submissionNotes: "",
  });

  // ✅ Fetch task + bids
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskResponse, bidsResponse] = await Promise.all([
          taskAPI.getById(id),
          bidAPI.getForTask(id),
        ]);

        if (taskResponse?.success) setTask(taskResponse.data);
        if (bidsResponse?.success) setBids(bidsResponse.data);
      } catch (err) {
        console.error("Error fetching task details:", err);
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

  // Helpers
  const isTaskOwner = user?.id && user?.id === task?.userId;
  const isAssignedFreelancer = user?.id && user?.id === task?.assignedTo;
  const userExistingBid = bids.find((bid) => bid.freelancerId === user?.id);

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
    } catch (err) {
      console.error("Error submitting work:", err);
      alert("Error submitting work. Please try again.");
    }
  };

  // ✅ Assign Task
  const handleAssignTask = async (bidId) => {
    if (!window.confirm("Assign this task to this junior?")) return;

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

      {/* Bid Modal */}
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
