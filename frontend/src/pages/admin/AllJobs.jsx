import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

const STATUS_COLORS = {
  Open: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function AllJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  async function load() {
    try {
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No jobs found" message="No jobs match the filter." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Job Title</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Package</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Deadline</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Applications</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.job_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{j.job_title}</p>
                    <p className="text-xs text-gray-500">{j.location || '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{j.company_name}</td>
                  <td className="px-5 py-3 text-gray-700">₹{j.package_lpa} LPA</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(j.deadline).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{j.application_count || 0}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        STATUS_COLORS[j.status] || 'bg-gray-100'
                      }`}
                    >
                      {j.status}
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