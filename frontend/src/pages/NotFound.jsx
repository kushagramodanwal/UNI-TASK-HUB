import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-white mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          <Link
            to="/"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-center"
          >
            Go Home
          </Link>
          <Link
            to="/browse-tasks"
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition text-center"
          >
            Browse Tasks
          </Link>
        </div>

        <p className="text-gray-500 text-sm">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
