import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PostTask from './pages/PostTask';
import BrowseTasks from './pages/BrowseTasks';
import MyTasks from './pages/MyTasks';
import MyBids from './pages/MyBids';
// import Reviews from './pages/Reviews';
import NotFound from './pages/NotFound';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setAuthTokenGetter } from './utils/api.js';
import TaskDetails from './pages/TaskDetails';

function App() {
  const { getToken } = useAuth();

  useEffect(() => {
    // ✅ Pass the function itself, not the result of calling it
    setAuthTokenGetter(getToken);
  }, [getToken]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
      }}
    >
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:id" element={<TaskDetails />} />

          {/* Protected: Post Task */}
          <Route
            path="/post-task"
            element={
              <>
                <SignedIn>
                  <PostTask />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route path="/browse-tasks" element={<BrowseTasks />} />

          {/* Protected: My Tasks */}
          <Route
            path="/my-tasks"
            element={
              <>
                <SignedIn>
                  <MyTasks />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Protected: My Bids */}
          <Route
            path="/my-bids"
            element={
              <>
                <SignedIn>
                  <MyBids />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* <Route path="/reviews" element={<Reviews />} /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
