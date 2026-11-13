import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

const STATUS_COLORS = {
  Applied: 'bg-gray-100 text-gray-700',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Interviewed: 'bg-purple-100 text-purple-700',
  Selected: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Withdrawn: 'bg-gray-100 text-gray-500',
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/applications/me');
      setApplications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function withdraw(id) {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw');
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h1>

      {loading ? (
        <Loading />
      ) : applications.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No applications yet"
          message="Start applying to jobs that match your profile."
          action={
            <Link
              to="/student/jobs"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition inline-block"
            >
              Browse Jobs →
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Job</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Applied</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.application_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{a.job_title}</td>
                  <td className="px-5 py-3 text-gray-600">{a.company_name}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(a.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[a.current_status] || 'bg-gray-100'}`}>
                      {a.current_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!['Selected', 'Rejected', 'Withdrawn'].includes(a.current_status) && (
                      <button
                        onClick={() => withdraw(a.application_id)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}