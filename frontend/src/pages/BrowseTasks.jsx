// src/pages/BrowseTasks.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { taskAPI } from "../utils/api.js";
const BrowseTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await taskAPI.getAll();
        if (response.success) {
          setTasks(response.data);
          setFilteredTasks(response.data);
        }
      } catch (err) {
        console.error(err);
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

  if (loading) {
    return <div className="text-center text-white">Loading tasks...</div>;
  }

  if (!tasks.length) {
    return <div className="text-center text-gray-400">No tasks available</div>;
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
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* College Filter */}
          <div>
            <label className="block text-white font-medium mb-2">Filter by College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={() => {
                setSearchTerm('');
                setSelectedCollege('');
                setSelectedCategory('');
              }}
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div
            key={task._id}
            className="bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-xl transition"
          >
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                {task.title}
              </h2>
              <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                {task.description}
              </p>

              <div className="text-sm text-gray-400 mb-2">
                <span className="font-semibold text-blue-400">₹{task.budget}</span>{" "}
                • {task.category}
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

            <button
              onClick={() => {
                if (task._id) {
                  navigate(`/task/${task._id}`);
                } else {
                  alert('Task ID not found');
                  console.error('Task ID is missing for task:', task);
                }
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              View Details
            </button>

          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseTasks;
