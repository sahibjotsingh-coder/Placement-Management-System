import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

// ============================================
// Helper — Safely format round_time (which may be a Date object or string)
// ============================================
function formatTime(timeValue) {
  if (!timeValue) return '';
  try {
    if (typeof timeValue === 'string') {
      // Could be "10:00:00" or ISO string
      if (timeValue.includes('T')) {
        const d = new Date(timeValue);
        return d.toISOString().slice(11, 16); // "HH:MM"
      }
      // Already "HH:MM:SS" or "HH:MM"
      return timeValue.slice(0, 5);
    }
    // It's a Date object
    const d = new Date(timeValue);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
}

// ============================================
// Helper — Safely format round_date
// ============================================
function formatDate(dateValue) {
  if (!dateValue) return 'TBD';
  try {
    const d = new Date(dateValue);
    // Use UTC to avoid timezone shifting (SQL DATE has no time)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return 'TBD';
  }
}

export default function ManageRounds() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    round_name: '',
    round_date: '',
    round_time: '',
    mode: 'Offline',
    venue_or_link: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    try {
      const [jobRes, roundsRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/interviews/job/${id}/rounds`),
      ]);
      setJob(jobRes.data.data);
      setRounds(roundsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function addRound(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.round_name) {
      setError('Round name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(`/interviews/job/${id}/rounds`, form);
      setSuccess(res.data.message || 'Round added and applicants notified!');
      setForm({
        round_name: '',
        round_date: '',
        round_time: '',
        mode: 'Offline',
        venue_or_link: '',
      });
      load();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add round');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRound(roundId) {
    if (!window.confirm('Delete this round? All applicants will be notified of the cancellation.')) return;
    try {
      await api.delete(`/interviews/rounds/${roundId}`);
      setSuccess('Round cancelled and applicants notified.');
      load();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  }

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/company/jobs" className="text-sm text-blue-600 hover:underline">
          ← Back to My Jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Manage Rounds</h1>
        <p className="text-gray-600 text-sm">{job?.job_title}</p>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-1">Add Round</h2>
          <p className="text-xs text-gray-500 mb-4">
            All applicants and TPO will be notified instantly.
          </p>

          <form onSubmit={addRound} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Round Name *</label>
              <input
                placeholder="e.g., Technical"
                value={form.round_name}
                onChange={(e) => setForm({ ...form, round_name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={form.round_date}
                onChange={(e) => setForm({ ...form, round_date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Time</label>
              <input
                type="time"
                value={form.round_time}
                onChange={(e) => setForm({ ...form, round_time: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Mode</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className={inputClass}
              >
                <option>Offline</option>
                <option>Online</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                {form.mode === 'Online' ? 'Meeting Link' : 'Venue'}
              </label>
              <input
                placeholder={
                  form.mode === 'Online'
                    ? 'https://meet.example.com/xyz'
                    : 'e.g., Block A, Room 101'
                }
                value={form.venue_or_link}
                onChange={(e) => setForm({ ...form, venue_or_link: e.target.value })}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Adding...' : '+ Add Round & Notify'}
            </button>
          </form>
        </div>

        {/* Right: List of rounds */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Rounds ({rounds.length})</h2>

          {rounds.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No rounds yet"
              message="Add your first interview round to notify applicants."
            />
          ) : (
            <div className="space-y-3">
              {rounds.map((r) => (
                <div
                  key={r.round_id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                          Round {r.round_number}
                        </span>
                        <p className="font-medium text-gray-800">{r.round_name}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          📅 {formatDate(r.round_date)}
                          {formatTime(r.round_time) && ` at ${formatTime(r.round_time)}`}
                        </div>
                        <div>🖥️ {r.mode}</div>
                        {r.venue_or_link && (
                          <div className="md:col-span-2">📍 {r.venue_or_link}</div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteRound(r.round_id)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium whitespace-nowrap ml-4"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}