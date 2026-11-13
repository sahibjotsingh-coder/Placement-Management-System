import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = user?.role === 'student'
    ? '/student/dashboard'
    : user?.role === 'company'
    ? '/company/dashboard'
    : '/admin/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-800 mb-6">
            Placement Management System
          </h1>
          <p className="text-xl text-gray-700 mb-4 max-w-2xl mx-auto">
            A centralized platform connecting students, recruiters, and the Training & Placement Office.
          </p>
          <p className="text-gray-600 mb-12">
            Streamline campus recruitment — from registration to final offer.
          </p>

          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg px-8 py-3 rounded-lg transition"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg px-8 py-3 rounded-lg transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-lg px-8 py-3 rounded-lg transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">For Students</h3>
              <p className="text-sm text-gray-600">
                Browse eligible jobs, apply, and track your applications through every interview round.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">For Companies</h3>
              <p className="text-sm text-gray-600">
                Post job openings, view eligible applicants, and manage interview rounds efficiently.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">For TPO</h3>
              <p className="text-sm text-gray-600">
                Oversee placements, verify companies, and generate real-time placement statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}