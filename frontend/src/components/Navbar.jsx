import { Link } from 'react-router-dom';
import { useAuth, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../utils/api.js';

const Navbar = () => {
  const { isSignedIn, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchUnreadCount();
      // Set up interval to check for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

  // Handle click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationAPI.getAll();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      // Refresh unread count
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationItemClick = async (notification) => {
    // Mark as read first
    await handleMarkAsRead(notification._id);
    
    // Close dropdown
    setShowNotifications(false);
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              UNI TASK HUB
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 flex-grow justify-center">
            <Link to="/" className="text-gray-400 hover:text-white text-sm font-medium transition">Home</Link>
            <Link to="/browse-tasks" className="text-gray-400 hover:text-white text-sm font-medium transition">Browse Tasks</Link>
            {isSignedIn && (
              <>
                <Link to="/post-task" className="text-gray-400 hover:text-white text-sm font-medium transition">Post Task</Link>
                <Link to="/my-tasks" className="text-gray-400 hover:text-white text-sm font-medium transition">My Tasks</Link>
                <Link to="/my-bids" className="text-gray-400 hover:text-white text-sm font-medium transition">My Bids</Link>
                <Link to="/reviews" className="text-gray-400 hover:text-white text-sm font-medium transition">Reviews</Link>
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={handleNotificationClick}
                    className={`text-gray-400 hover:text-white transition p-2 relative ${
                      showNotifications ? 'text-white' : ''
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5C16.5 12.5 16.5 11 16.5 9.5C16.5 7 14.5 5 12 5S7.5 7 7.5 9.5c0 1.5 0 3 0 4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin border-2 border-gray-600 border-t-blue-500 rounded-full w-6 h-6 mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">Loading notifications...</p>
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer ${
                                !notification.isRead ? 'bg-blue-900 bg-opacity-20' : ''
                              }`}
                              onClick={() => handleNotificationItemClick(notification)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm mb-1 flex items-center">
                                    {notification.title}
                                    {notification.priority === 'high' && (
                                      <span className="ml-2 text-red-400 text-xs">🔥</span>
                                    )}
                                    {notification.priority === 'medium' && (
                                      <span className="ml-2 text-yellow-400 text-xs">⚡</span>
                                    )}
                                  </h4>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-gray-500 text-xs">
                                      {notification.type === 'bid_received' && '💰'}
                                      {notification.type === 'task_submitted' && '📝'}
                                      {notification.type === 'payment_released' && '💳'}
                                      {notification.type === 'dispute_raised' && '⚠️'}
                                      {notification.type === 'general' && '🔔'}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {notification.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-xs mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-xs">
                                      {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                    {!notification.isRead && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <div className="text-gray-400 text-4xl mb-2">🔔</div>
                            <p className="text-gray-400 text-sm">No notifications yet</p>
                            <p className="text-gray-500 text-xs mt-1">You're all caught up!</p>
                          </div>
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-700 text-center">
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <span className="text-gray-400 text-sm font-medium">{user?.firstName}</span>
                <UserButton
                  appearance={{
                    elements: { avatarBox: "w-10 h-10" }
                  }}
                />
                {/* <SignOutButton>
                  <button className="px-4 py-2 rounded-lg border border-white text-white text-sm font-medium hover:bg-white hover:text-black transition">
                    Sign Out
                  </button>
                </SignOutButton> */}
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold shadow hover:shadow-lg transition">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
