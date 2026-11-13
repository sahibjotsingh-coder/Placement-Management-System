import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import api from '../../api/axios';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    full_name: '', phone: '', cgpa: '', active_backlogs: '',
    tenth_percentage: '', twelfth_percentage: '',
    linkedin_url: '', github_url: '', resume_url: '',
  });

  async function load() {
    try {
      const [profileRes, skillsRes] = await Promise.all([
        api.get('/students/me'),
        api.get('/students/skills'),
      ]);
      const p = profileRes.data.data;
      setProfile(p);
      setSkills(p.skills || []);
      setAllSkills(skillsRes.data.data);
      setForm({
        full_name: p.full_name || '',
        phone: p.phone || '',
        cgpa: p.cgpa || '',
        active_backlogs: p.active_backlogs || 0,
        tenth_percentage: p.tenth_percentage || '',
        twelfth_percentage: p.twelfth_percentage || '',
        linkedin_url: p.linkedin_url || '',
        github_url: p.github_url || '',
        resume_url: p.resume_url || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/students/${profile.student_id}`, form);
      setMessage({ type: 'success', text: 'Profile updated!' });
      load();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Update failed',
      });
    } finally {
      setSaving(false);
    }
  }

  async function addSkill(skillId) {
    if (!skillId) return;
    try {
      await api.post('/students/me/skills', {
        skill_id: parseInt(skillId),
        proficiency: 'Intermediate',
      });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add');
    }
  }

  async function removeSkill(skillId) {
    try {
      await api.delete(`/students/me/skills/${skillId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  }

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile info */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Full Name</label>
              <input
                className={inputClass}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>CGPA</label>
              <input type="number" step="0.01" min="0" max="10" className={inputClass}
                value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>10th %</label>
              <input type="number" step="0.01" className={inputClass}
                value={form.tenth_percentage}
                onChange={(e) => setForm({ ...form, tenth_percentage: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>12th %</label>
              <input type="number" step="0.01" className={inputClass}
                value={form.twelfth_percentage}
                onChange={(e) => setForm({ ...form, twelfth_percentage: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Active Backlogs</label>
              <input type="number" min="0" className={inputClass}
                value={form.active_backlogs}
                onChange={(e) => setForm({ ...form, active_backlogs: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>LinkedIn</label>
              <input className={inputClass} value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>GitHub</label>
              <input className={inputClass} value={form.github_url}
                onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">My Skills</h2>

          {skills.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">No skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((s) => (
                <span key={s.skill_id}
                  className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-2">
                  {s.skill_name} ({s.proficiency})
                  <button onClick={() => removeSkill(s.skill_id)}
                    className="text-red-500 hover:text-red-700 font-bold">×</button>
                </span>
              ))}
            </div>
          )}

          <label className={labelClass}>Add a skill</label>
          <select className={inputClass}
            onChange={(e) => { addSkill(e.target.value); e.target.value = ''; }}
            value="">
            <option value="">Select skill...</option>
            {allSkills
              .filter((sk) => !skills.find((s) => s.skill_id === sk.skill_id))
              .map((sk) => (
                <option key={sk.skill_id} value={sk.skill_id}>{sk.skill_name}</option>
              ))}
          </select>
        </div>
      </div>
    </DashboardLayout>
  );
}