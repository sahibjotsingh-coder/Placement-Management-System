import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    job_title: '',
    job_description: '',
    job_type: 'Full-Time',
    package_lpa: '',
    location: '',
    min_cgpa: '7.0',
    max_backlogs: '0',
    eligible_depts: 'CSE,IT',
    eligible_grad_year: 2026,
    deadline: '',
    drive_date: '',
    openings: 1,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Convert numeric fields
    const payload = {
      ...form,
      package_lpa: parseFloat(form.package_lpa),
      min_cgpa: parseFloat(form.min_cgpa),
      max_backlogs: parseInt(form.max_backlogs),
      openings: parseInt(form.openings),
      eligible_grad_year: parseInt(form.eligible_grad_year),
    };

    try {
      const res = await api.post('/jobs', payload);
      navigate(`/company/jobs`);
      alert('Job posted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Job Title *</label>
            <input
              name="job_title"
              required
              value={form.job_title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g., Software Engineer"
            />
          </div>

          <div>
            <label className={labelClass}>Job Description</label>
            <textarea
              name="job_description"
              rows={4}
              value={form.job_description}
              onChange={handleChange}
              className={inputClass}
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Job Type</label>
              <select name="job_type" value={form.job_type} onChange={handleChange} className={inputClass}>
                <option>Full-Time</option>
                <option>Internship</option>
                <option>Part-Time</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Package (LPA) *</label>
              <input
                name="package_lpa"
                type="number"
                step="0.01"
                required
                value={form.package_lpa}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., 8.5"
              />
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input name="location" value={form.location} onChange={handleChange} className={inputClass} placeholder="e.g., Bangalore" />
            </div>

            <div>
              <label className={labelClass}>Openings</label>
              <input name="openings" type="number" min="1" value={form.openings} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="border-t pt-5">
            <h2 className="text-md font-semibold text-gray-800 mb-3">Eligibility Criteria</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Minimum CGPA</label>
                <input name="min_cgpa" type="number" step="0.01" value={form.min_cgpa} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Maximum Backlogs</label>
                <input name="max_backlogs" type="number" value={form.max_backlogs} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Eligible Departments (comma-separated)</label>
                <input
                  name="eligible_depts"
                  value={form.eligible_depts}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g., CSE,IT,ECE"
                />
              </div>

              <div>
                <label className={labelClass}>Eligible Graduation Year</label>
                <input name="eligible_grad_year" type="number" value={form.eligible_grad_year} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="border-t pt-5">
            <h2 className="text-md font-semibold text-gray-800 mb-3">Schedule</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Application Deadline *</label>
                <input name="deadline" type="date" required value={form.deadline} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Drive Date</label>
                <input name="drive_date" type="date" value={form.drive_date} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/company/jobs')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}