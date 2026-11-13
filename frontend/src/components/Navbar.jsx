import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await api.get('/notifications/me/unread-count');
        setUnread(res.data.data.unread_count);
      } catch {
        setUnread(0);
      }
    }
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => clearInterval(timer);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-700">
          Placement System
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            className="relative text-gray-600 hover:text-gray-900"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                {unread}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                {user?.email?.[0]?.toUpperCase()}
              </span>
              <span className="hidden md:inline">{user?.email}</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  {user?.role?.toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}