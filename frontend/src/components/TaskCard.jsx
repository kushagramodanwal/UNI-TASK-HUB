const TaskCard = ({ task, onViewDetails, showActions = false, onEdit, onDelete }) => {
  const getStatusClasses = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-600 text-white';
      case 'in-progress':
        return 'bg-yellow-500 text-black';
      case 'completed':
        return 'bg-gray-700 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4 flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{task.title}</h3>
          <p className="text-gray-400 text-sm mt-1">{task.description}</p>
        </div>
        <div className="ml-4">
          <span className="text-green-400 font-medium">₹{task.budget}</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col sm:flex-row gap-2 text-gray-400 text-sm">
        <span><span className="font-semibold text-gray-300">Category:</span> {task.category}</span>
        <span><span className="font-semibold text-gray-300">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}</span>
        <span><span className="font-semibold text-gray-300">Posted by:</span> {task.userName}</span>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClasses(task.status)}`}>
            {task.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showActions && (
            <>
              <button
                onClick={() => onEdit(task)}
                className="text-blue-400 hover:text-blue-500 text-xs transition"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="text-red-500 hover:text-red-600 text-xs transition"
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => onViewDetails(task)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
