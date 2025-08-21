import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../utils/api.js';


const PostTask = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    college: '',
    budget: '',
    deadline: '',
    requirements: ''
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not signed in
  if (!isSignedIn) {
    navigate('/');
    return null;
  }

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file changes
  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const taskPayload = new FormData();

      // Required fields
      taskPayload.append('title', formData.title.trim());
      taskPayload.append('description', formData.description.trim());
      taskPayload.append('category', formData.category);
      taskPayload.append('college', formData.college.trim());

      // Convert numeric + date fields
      if (formData.budget) {
        taskPayload.append('budget', Number(formData.budget));
      }
      if (formData.deadline) {
        taskPayload.append('deadline', new Date(formData.deadline).toISOString());
      }

      if (formData.requirements) {
        taskPayload.append('requirements', formData.requirements.trim());
      }

      // Attach files
      for (let i = 0; i < files.length; i++) {
        taskPayload.append('files', files[i]);
      }

      // Debugging: print all values
      for (let [key, val] of taskPayload.entries()) {
        console.log(key, val);
      }

      const response = await taskAPI.create(taskPayload);

      if (response.success) {
        navigate('/my-tasks');
      } else {
        setError(response.message || 'Failed to create task');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Academic Writing',
    'Programming',
    'Design',
    'Research',
    'Translation',
    'Data Analysis',
    'Presentation',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Post a New Task</h1>
          <p className="text-gray-400">
            Share your task with the university community and find the perfect match.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          {error && (
            <div className="bg-red-600 text-white p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-white font-medium mb-1">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter a clear, descriptive title"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-white font-medium mb-1"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Provide detailed information about your task"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-white font-medium mb-1"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* College */}
            <div>
              <label
                htmlFor="college"
                className="block text-white font-medium mb-1"
              >
                College/University *
              </label>
              <input
                type="text"
                id="college"
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your college or university name"
              />
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="budget"
                className="block text-white font-medium mb-1"
              >
                Budget (INR) *
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                required
                min="1"
                step="0.01"
                className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your budget in INR"
              />
            </div>

            {/* Deadline */}
            <div>
              <label
                htmlFor="deadline"
                className="block text-white font-medium mb-1"
              >
                Deadline *
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Requirements */}
            <div>
              <label
                htmlFor="requirements"
                className="block text-white font-medium mb-1"
              >
                Additional Requirements
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Any specific requirements or preferences (optional)"
              />
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="files"
                className="block text-white font-medium mb-1"
              >
                Attach Files (optional)
              </label>
              <input
                type="file"
                id="files"
                name="files"
                multiple
                onChange={handleFileChange}
                className="w-full text-gray-200"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={() => navigate('/my-tasks')}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostTask;
