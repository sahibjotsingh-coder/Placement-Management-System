import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/reports/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const kpiCards = [
    {
      label: 'Total Students',
      value: stats?.total_students ?? 0,
      sub: `${stats?.placed_students ?? 0} placed · ${stats?.unplaced_students ?? 0} seeking`,
      color: 'text-blue-600',
      icon: '🎓',
    },
    {
      label: 'Total Companies',
      value: stats?.total_companies ?? 0,
      sub: `${stats?.verified_companies ?? 0} verified`,
      color: 'text-indigo-600',
      icon: '🏢',
    },
    {
      label: 'Total Jobs',
      value: stats?.total_jobs ?? 0,
      sub: `${stats?.open_jobs ?? 0} open`,
      color: 'text-purple-600',
      icon: '💼',
    },
    {
      label: 'Applications',
      value: stats?.total_applications ?? 0,
      sub: `${stats?.selected_applications ?? 0} selected`,
      color: 'text-cyan-600',
      icon: '📝',
    },
    {
      label: 'Placement Rate',
      value: `${stats?.placement_rate ?? 0}%`,
      sub: `${stats?.accepted_offers ?? 0} offers accepted`,
      color: 'text-green-600',
      icon: '📊',
    },
    {
      label: 'Highest Package',
      value: `₹${stats?.highest_package ?? 0} LPA`,
      sub: `Avg ₹${Number(stats?.avg_package ?? 0).toFixed(1)} LPA`,
      color: 'text-orange-600',
      icon: '💰',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard 📊</h1>
        <p className="text-gray-600 text-sm mt-1">
          Real-time overview of the placement system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-500">{card.label}</p>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/students"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            🎓 Manage Students
          </Link>
          <Link
            to="/admin/companies"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            🏢 Manage Companies
          </Link>
          <Link
            to="/admin/jobs"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            💼 View All Jobs
          </Link>
          <Link
            to="/admin/applications"
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            📝 All Applications
          </Link>
          <Link
            to="/admin/reports"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            📊 View Reports
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}