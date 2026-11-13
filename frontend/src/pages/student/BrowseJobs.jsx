import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import JobCard from '../../components/JobCard';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      const res = await api.get('/students/me/eligible-jobs');
      setJobs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApply(jobId) {
    setApplying(jobId);
    setMessage(null);
    try {
      await api.post('/applications', { job_id: jobId });
      setMessage({ type: 'success', text: 'Application submitted!' });
      load(); // refresh
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to apply',
      });
    } finally {
      setApplying(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Eligible Jobs</h1>
        <span className="text-sm text-gray-500">{jobs.length} jobs match your profile</span>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No eligible jobs yet"
          message="Update your profile or check back later."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              showApply
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}