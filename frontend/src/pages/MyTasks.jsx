import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import { taskAPI } from '../utils/api.js';

const MyTasks = () => {
  const { isSignedIn, user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn) navigate('/');
  }, [isSignedIn, navigate]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await taskAPI.getMyTasks();
      if (response.success) {
        setTasks(response.data || []);
        setFilteredTasks(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [user]);

  useEffect(() => {
    if (statusFilter) {
      setFilteredTasks(tasks.filter(task => task.status === statusFilter));
    } else {
      setFilteredTasks(tasks);
    }
  }, [tasks, statusFilter]);

  const handleViewDetails = (task) => navigate(`/task/${task._id}`);
  const handleEdit = (task) => console.log('Editing task:', task);

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await taskAPI.delete(taskId);
      if (response.success) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
      } else {
        setError(response.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const getStatusCount = (status) => tasks.filter(task => task.status === status).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin border-4 border-gray-700 border-t-blue-500 rounded-full w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Tasks</h1>
          <p className="text-gray-400">Manage and track all the tasks you've posted.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-6">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 text-center">
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-white text-2xl font-bold">{tasks.length}</div>
            <div className="text-gray-400">Total Tasks</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-green-500 text-2xl font-bold">{getStatusCount('open')}</div>
            <div className="text-gray-400">Open</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-yellow-400 text-2xl font-bold">{getStatusCount('in-progress')}</div>
            <div className="text-gray-400">In Progress</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-cyan-400 text-2xl font-bold">{getStatusCount('completed')}</div>
            <div className="text-gray-400">Completed</div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-gray-800 p-4 rounded mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-white font-medium">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tasks</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button
            onClick={() => navigate('/post-task')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          >
            Post New Task
          </button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onViewDetails={handleViewDetails}
                showActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              {statusFilter ? `No ${statusFilter} tasks found.` : "You haven't posted any tasks yet."}
            </p>
            {!statusFilter && (
              <button
                onClick={() => navigate('/post-task')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              >
                Post Your First Task
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyTasks;
