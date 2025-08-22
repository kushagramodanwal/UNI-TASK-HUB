// src/pages/BrowseTasks.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { taskAPI } from "../utils/api.js";

const BrowseTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await taskAPI.getAll();
        
        if (response.success) {
          setTasks(response.data);
          setFilteredTasks(response.data);
        } else {
          setError(response.message || 'Failed to fetch tasks');
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.college?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCollege) {
      filtered = filtered.filter(task => task.college === selectedCollege);
    }

    if (selectedCategory) {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, selectedCollege, selectedCategory]);

  const handleTaskClick = (task) => {
    if (!task._id) {
      console.error('Task ID is missing for task:', task);
      alert('Error: Task ID not found. Please try refreshing the page.');
      return;
    }

    // Navigate to task details
    navigate(`/task/${task._id}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCollege('');
    setSelectedCategory('');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center text-white py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center text-red-400 py-20">
          <p className="text-xl mb-4">Error loading tasks</p>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center text-gray-400 py-20">
          <p className="text-xl mb-4">No tasks available</p>
          <p>Check back later for new opportunities!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Available Tasks</h1>

      {/* Search and Filters */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div>
            <label className="block text-white font-medium mb-2">Search Tasks</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, or college..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* College Filter */}
          <div>
            <label className="block text-white font-medium mb-2">Filter by College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Colleges</option>
              {Array.from(new Set(tasks.map(task => task.college).filter(Boolean))).map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-white font-medium mb-2">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Categories</option>
              <option value="Academic Writing">Academic Writing</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Research">Research</option>
              <option value="Translation">Translation</option>
              <option value="Data Analysis">Data Analysis</option>
              <option value="Presentation">Presentation</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedCollege || selectedCategory) && (
          <div className="mt-4 text-center">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-400">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      </div>

      {/* Tasks Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div
            key={task._id}
            className="bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
            onClick={() => handleTaskClick(task)}
          >
            <div>
              <h2 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {task.title}
              </h2>
              <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                {task.description}
              </p>

              <div className="text-sm text-gray-400 mb-2">
                <span className="font-semibold text-cyan-400">₹{task.budget}</span>
                {" "}• {task.category}
              </div>
              
              <div className="text-xs text-gray-500 mb-2">
                Deadline: {new Date(task.deadline).toLocaleDateString()}
              </div>

              {/* College and Bidding Info */}
              <div className="space-y-2 mb-2">
                <div className="text-xs text-gray-400">
                  <span className="text-gray-500">College:</span> {task.college || 'Not specified'}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    🔒 Anonymous Bidding
                  </span>
                  {task.bidCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {task.bidCount} bid{task.bidCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="text-center text-gray-400 py-20">
          <p className="text-xl mb-4">No tasks match your filters</p>
          <button
            onClick={handleClearFilters}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseTasks;
