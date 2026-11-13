import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

const STATUS_OPTIONS = ['Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected', 'On Hold'];
const STATUS_COLORS = {
  Applied: 'bg-gray-100 text-gray-700',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Interviewed: 'bg-purple-100 text-purple-700',
  Selected: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Withdrawn: 'bg-gray-100 text-gray-500',
};

export default function JobApplicants() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/applications/job/${id}`),
      ]);
      setJob(jobRes.data.data);
      setApplications(appsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(applicationId, newStatus) {
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  }

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/company/jobs" className="text-sm text-blue-600 hover:underline">
          ← Back to My Jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{job?.job_title}</h1>
        <p className="text-gray-600 text-sm">
          {applications.length} applicant{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No applications yet"
          message="Students haven't applied to this job yet."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Dept</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">CGPA</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Applied</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Update</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.application_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{app.full_name}</p>
                    <p className="text-xs text-gray-500">{app.roll_number}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{app.dept_code}</td>
                  <td className="px-5 py-3 text-gray-700">{app.cgpa}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(app.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[app.current_status]}`}>
                      {app.current_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <select
                      value={app.current_status}
                      onChange={(e) => changeStatus(app.application_id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
