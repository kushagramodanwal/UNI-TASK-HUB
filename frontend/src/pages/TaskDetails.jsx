// src/pages/TaskDetails.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { taskAPI, bidAPI } from "../utils/api.js";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";

const TaskDetails = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingBids, setLoadingBids] = useState(true);
  const [error, setError] = useState(null);

  const { isSignedIn } = useUser();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoadingTask(true);
        const res = await taskAPI.getById(id);
        if (!res || res.success === false) throw new Error(res?.message || "Failed to fetch task");
        setTask(res.data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading task");
      } finally {
        setLoadingTask(false);
      }
    };

    fetchTask();
  }, [id]);

  useEffect(() => {
    const fetchBids = async () => {
      if (!isSignedIn) return; // Only fetch bids for signed-in users
      try {
        setLoadingBids(true);
        const res = await bidAPI.getForTask(id);
        if (res.success !== false) setBids(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBids(false);
      }
    };

    fetchBids();
  }, [id, isSignedIn]);

  if (loadingTask) return <div className="text-white p-10">Loading task...</div>;
  if (error) return <div className="text-red-400 p-10">{error}</div>;
  if (!task) return <div className="text-gray-400 p-10">Task not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl text-white min-h-[80vh]">
      {/* Task Info */}
      <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
      <p className="mb-4">{task.description}</p>

      <div className="mb-4 text-gray-300">
        <p><strong>Category:</strong> {task.category}</p>
        <p><strong>Budget:</strong> ₹{task.budget}</p>
        <p><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</p>
        <p><strong>College:</strong> {task.college || "Not specified"}</p>
      </div>

      {/* Bids */}
      <SignedIn>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Bids ({bids.length})</h2>
          {loadingBids ? (
            <p className="text-gray-400">Loading bids...</p>
          ) : bids.length === 0 ? (
            <p className="text-gray-400">No bids yet</p>
          ) : (
            <ul className="space-y-2">
              {bids.map((bid) => (
                <li key={bid._id} className="bg-gray-800 p-3 rounded-lg">
                  <p><strong>Amount:</strong> ₹{bid.amount}</p>
                  <p><strong>Message:</strong> {bid.message}</p>
                  <p className="text-gray-400 text-xs">By User ID: {bid.userId}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="text-gray-400 mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="mb-2">Sign in to view and place bids for this task.</p>
          <RedirectToSignIn />
        </div>
      </SignedOut>
    </div>
  );
};

export default TaskDetails;
