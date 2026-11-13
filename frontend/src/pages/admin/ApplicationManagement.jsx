import { useEffect, useState } from 'react';
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

export default function ApplicationManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch all open+closed jobs, then pull applications for each
        const jobsRes = await api.get('/jobs?status=');
        const jobs = jobsRes.data.data;

        const allApps = [];
        for (const job of jobs) {
          try {
            const appsRes = await api.get(`/applications/job/${job.job_id}`);
            appsRes.data.data.forEach((app) => {
              allApps.push({
                ...app,
                job_title: job.job_title,
                company_name: job.company_name,
                job_id: job.job_id,
              });
            });
          } catch {
            // Skip jobs where admin isn't allowed (all are allowed, but be safe)
          }
        }

        allApps.sort(
          (a, b) => new Date(b.applied_at) - new Date(a.applied_at)
        );
        setApplications(allApps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Applications</h1>
        <p className="text-sm text-gray-500 mt-1">
          {applications.length} application{applications.length !== 1 ? 's' : ''} across all jobs
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : applications.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No applications yet"
          message="Students haven't applied to any jobs."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Roll No</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Job</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Applied</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr
                  key={a.application_id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-3 font-medium text-gray-800">{a.full_name}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">
                    {a.roll_number}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{a.job_title}</td>
                  <td className="px-5 py-3 text-gray-600">{a.company_name}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(a.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        STATUS_COLORS[a.current_status] || 'bg-gray-100'
                      }`}
                    >
                      {a.current_status}
                    </span>
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