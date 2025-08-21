import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const Home = () => {
  const { isSignedIn } = useAuth();

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Hero Section */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">UNI TASK HUB</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-8">
            Connect with university students who can help with your tasks. Find assignments, freelance work, and build your network.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {isSignedIn ? (
              <>
                <Link to="/post-task" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition">
                  Post a Task
                </Link>
                <Link to="/browse-tasks" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition">
                  Browse Tasks
                </Link>
              </>
            ) : (
              <>
                <Link to="/browse-tasks" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition">
                  Browse Tasks
                </Link>
                <Link to="/" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose UNI TASK HUB?</h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto">
              The ultimate platform for university students to connect, collaborate, and complete tasks together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg text-center hover:shadow-lg transition">
              <div className="text-indigo-500 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-12 h-12 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Post Tasks</h3>
              <p className="text-gray-300 text-sm">
                Easily post your tasks and assignments. Set your budget and deadline to find the perfect match.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg text-center hover:shadow-lg transition">
              <div className="text-purple-500 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-12 h-12 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Tasks</h3>
              <p className="text-gray-300 text-sm">
                Discover tasks from other students. Filter by category, budget, and deadline to find what you need.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg text-center hover:shadow-lg transition">
              <div className="text-pink-500 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-12 h-12 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              {/* <h3 className="text-xl font-semibold mb-2">Rate & Review</h3>
              <p className="text-gray-300 text-sm">
                Build your reputation with reviews and ratings. Trust the community to find reliable partners.
              </p> */}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of university students who are already using UNI TASK HUB to connect and collaborate.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/browse-tasks" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition">
              Start Browsing
            </Link>
            {!isSignedIn && (
              <Link to="/" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition">
                Sign Up Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
