import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import api from '../../api/axios';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleApply() {
    setApplying(true);
    setMessage(null);
    try {
      await api.post('/applications', { job_id: parseInt(id) });
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to apply',
      });
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;
  if (!job) return <DashboardLayout><div>Job not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <Link to="/student/jobs" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Jobs
      </Link>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{job.job_title}</h1>
            <p className="text-gray-600 mt-1">
              {job.company_name} · {job.location || 'Location N/A'}
            </p>
          </div>
          <span className="text-lg font-bold text-green-700 bg-green-50 px-3 py-1 rounded">
            ₹{job.package_lpa} LPA
          </span>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{job.job_type}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">Openings: {job.openings}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">Min CGPA: {job.min_cgpa}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">Max Backlogs: {job.max_backlogs}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">Depts: {job.eligible_depts}</span>
        </div>

        {/* Full description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {job.job_description || 'No description provided.'}
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border-t pt-4">
          <div>
            <p className="text-xs text-gray-500">Application Deadline</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(job.deadline).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Drive Date</p>
            <p className="text-sm font-medium text-gray-800">
              {job.drive_date ? new Date(job.drive_date).toLocaleDateString() : 'TBA'}
            </p>
          </div>
        </div>

        {/* Interview rounds */}
        {job.rounds && job.rounds.length > 0 && (
          <div className="mb-6 border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Interview Rounds</h2>
            <div className="space-y-2">
              {job.rounds.map((r) => (
                <div key={r.round_id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">
                    Round {r.round_number}: {r.round_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.round_date || 'TBD'}
                    {r.round_time && ` · ${r.round_time}`}
                    {' · '}{r.mode}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply button */}
        <div className="border-t pt-4">
          <button
            onClick={handleApply}
            disabled={applying || job.status !== 'Open'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {applying ? 'Applying...' : job.status === 'Open' ? 'Apply Now' : `Job ${job.status}`}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}