import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  const linksByRole = {
    student: [
      { to: '/student/dashboard', label: '🏠 Dashboard' },
      { to: '/student/jobs', label: '💼 Browse Jobs' },
      { to: '/student/applications', label: '📝 My Applications' },
      { to: '/student/profile', label: '👤 My Profile' },
      { to: '/notifications', label: '🔔 Notifications' },
    ],
    company: [
      { to: '/company/dashboard', label: '🏠 Dashboard' },
      { to: '/company/jobs', label: '💼 My Jobs' },
      { to: '/company/jobs/new', label: '➕ Post Job' },
      { to: '/notifications', label: '🔔 Notifications' },
    ],
    admin: [
      { to: '/admin/dashboard', label: '🏠 Dashboard' },
      { to: '/admin/students', label: '🎓 Students' },
      { to: '/admin/companies', label: '🏢 Companies' },
      { to: '/admin/jobs', label: '💼 Jobs' },
      { to: '/admin/applications', label: '📝 Applications' },
      { to: '/admin/reports', label: '📊 Reports' },
      { to: '/notifications', label: '🔔 Notifications' },
    ],
  };

  const links = linksByRole[user?.role] || [];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}