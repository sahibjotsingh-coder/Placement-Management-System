import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

const STATUS_COLORS = {
  Open: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/companies/me/jobs');
      setJobs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancelJob(jobId) {
    if (!window.confirm('Cancel this job? Students will no longer be able to apply.')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Jobs</h1>
        <Link
          to="/company/jobs/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          ➕ Post New Job
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No jobs posted yet"
          message="Post your first job to start receiving applications."
          action={
            <Link
              to="/company/jobs/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition inline-block"
            >
              Post a Job →
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Job Title</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Package</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Deadline</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Applications</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.job_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{job.job_title}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    ₹{job.package_lpa} LPA
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(job.deadline).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-700 font-medium">
                      {job.application_count || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[job.status] || 'bg-gray-100'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/company/jobs/${job.job_id}/applicants`}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        Applicants
                      </Link>
                      <Link
                        to={`/company/jobs/${job.job_id}/rounds`}
                        className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                      >
                        Rounds
                      </Link>
                      {job.status === 'Open' && (
                        <button
                          onClick={() => cancelJob(job.job_id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
