import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-4 mb-4">
            
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                UNI TASK HUB
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-6">
              Connect with experts who can help with your tasks. Find assignments, freelance work, and more.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition">Home</Link>
              </li>
              <li>
                <Link to="/browse-tasks" className="text-gray-400 hover:text-white text-sm transition">Browse Tasks</Link>
              </li>
              <li>
                <Link to="/post-task" className="text-gray-400 hover:text-white text-sm transition">Post a Task</Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition">Login</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Connect With Us</h3>
            <a
              href="mailto:unitaskhub@gmail.com"
              className="text-gray-400 hover:text-white text-sm transition"
            >
              unitaskhub@gmail.com
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© 2025 UNITASKHUB. All rights reserved.</p>
          <div className="flex gap-6">
            {/* Optional links */}
            {/* <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
