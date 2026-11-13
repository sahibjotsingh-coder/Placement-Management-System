import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import api from '../../api/axios';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ deptId: '', minCgpa: '', isPlaced: '' });

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.deptId) params.append('deptId', filters.deptId);
      if (filters.minCgpa) params.append('minCgpa', filters.minCgpa);
      if (filters.isPlaced !== '') params.append('isPlaced', filters.isPlaced);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filters]);

  const inputClass =
    'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={filters.deptId}
          onChange={(e) => setFilters({ ...filters, deptId: e.target.value })}
          className={inputClass}
        >
          <option value="">All Departments</option>
          <option value="1">CSE</option>
          <option value="2">IT</option>
          <option value="3">ECE</option>
          <option value="4">MECH</option>
          <option value="5">EEE</option>
        </select>

        <input
          type="number"
          step="0.01"
          placeholder="Min CGPA"
          value={filters.minCgpa}
          onChange={(e) => setFilters({ ...filters, minCgpa: e.target.value })}
          className={inputClass}
        />

        <select
          value={filters.isPlaced}
          onChange={(e) => setFilters({ ...filters, isPlaced: e.target.value })}
          className={inputClass}
        >
          <option value="">All Students</option>
          <option value="true">Placed</option>
          <option value="false">Not Placed</option>
        </select>

        <button
          onClick={() => setFilters({ deptId: '', minCgpa: '', isPlaced: '' })}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : students.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No students found"
          message="Try adjusting the filters above."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Roll No</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Dept</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">CGPA</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Backlogs</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Year</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.student_id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-3 text-gray-700 font-mono text-xs">
                    {s.roll_number}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{s.full_name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{s.dept_code}</td>
                  <td className="px-5 py-3 text-gray-700">{s.cgpa}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        s.active_backlogs > 0
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                      }
                    >
                      {s.active_backlogs}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{s.graduation_year}</td>
                  <td className="px-5 py-3">
                    {s.is_placed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        ✅ Placed
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Seeking
                      </span>
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