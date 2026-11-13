import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  async function load() {
    try {
      const params = new URLSearchParams();
      if (filter !== '') params.append('isVerified', filter);
      const res = await api.get(`/companies?${params.toString()}`);
      setCompanies(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function verify(id, name) {
    if (!window.confirm(`Verify "${name}"? This allows them to post jobs.`)) return;
    try {
      await api.put(`/companies/${id}/verify`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify');
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Companies</h1>
          <p className="text-sm text-gray-500 mt-1">
            {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Companies</option>
          <option value="true">Verified Only</option>
          <option value="false">Pending Verification</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : companies.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No companies found"
          message="No companies match your filter."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Industry</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Jobs Posted</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Placements</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">HR</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr
                  key={c.company_id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{c.company_name}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.industry || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{c.total_jobs}</td>
                  <td className="px-5 py-3 text-gray-700">{c.total_placements}</td>
                  <td className="px-5 py-3 text-gray-600">
                    <p className="text-xs">{c.hr_name || '—'}</p>
                    <p className="text-xs text-gray-400">{c.hr_contact || ''}</p>
                  </td>
                  <td className="px-5 py-3">
                    {c.is_verified ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        ✅ Verified
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!c.is_verified ? (
                      <button
                        onClick={() => verify(c.company_id, c.company_name)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded transition"
                      >
                        Verify
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
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