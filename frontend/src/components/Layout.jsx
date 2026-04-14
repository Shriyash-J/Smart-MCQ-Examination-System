import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">SmartMCQ</Link>
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                {user?.role === 'instructor' && (
                  <Link to="/create-exam" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Create Exam</Link>
                )}
                <Link to="/results" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">My Results</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name} ({user?.role})</span>
              <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;