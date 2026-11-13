import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, jobsRes, appsRes] = await Promise.all([
          api.get('/students/me'),
          api.get('/students/me/eligible-jobs'),
          api.get('/applications/me'),
        ]);
        setProfile(profileRes.data.data);
        setEligibleCount(jobsRes.data.data.length);
        setApplicationCount(appsRes.data.data.length);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 🎓
      </h1>
      <p className="text-gray-600 mb-6">{profile?.roll_number} · {profile?.dept_name}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Eligible Jobs</p>
          <p className="text-3xl font-bold text-blue-600">{eligibleCount}</p>
          <Link to="/student/jobs" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Browse →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">My Applications</p>
          <p className="text-3xl font-bold text-indigo-600">{applicationCount}</p>
          <Link to="/student/applications" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
            View →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <p className={`text-2xl font-bold ${profile?.is_placed ? 'text-green-600' : 'text-gray-700'}`}>
            {profile?.is_placed ? 'Placed ✅' : 'Seeking'}
          </p>
          <p className="text-xs text-gray-500 mt-2">CGPA: {profile?.cgpa}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/student/jobs" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            💼 Browse Jobs
          </Link>
          <Link to="/student/profile" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition">
            👤 Update Profile
          </Link>
          <Link to="/student/applications" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition">
            📝 Track Applications
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}