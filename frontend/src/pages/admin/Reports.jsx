import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import api from '../../api/axios';

export default function Reports() {
  const [deptData, setDeptData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [packageStats, setPackageStats] = useState(null);
  const [topRecruiters, setTopRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [deptRes, companyRes, pkgRes, topRes] = await Promise.all([
          api.get('/reports/department-summary'),
          api.get('/reports/placement-summary'),
          api.get('/reports/package-stats'),
          api.get('/reports/top-recruiters?limit=5'),
        ]);
        setDeptData(deptRes.data.data);
        setCompanyData(companyRes.data.data);
        setPackageStats(pkgRes.data.data);
        setTopRecruiters(topRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Placement Reports 📊</h1>

      {/* Package Stats - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Offers</p>
          <p className="text-2xl font-bold text-blue-600">
            {packageStats?.overall?.total_offers || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Average Package</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{Number(packageStats?.overall?.avg_package || 0).toFixed(1)} LPA
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Highest Package</p>
          <p className="text-2xl font-bold text-orange-600">
            ₹{packageStats?.overall?.highest_package || 0} LPA
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Lowest Package</p>
          <p className="text-2xl font-bold text-gray-700">
            ₹{packageStats?.overall?.lowest_package || 0} LPA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Placement by Department
          </h2>
          {deptData.length === 0 ? (
            <p className="text-sm text-gray-500">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left py-2">Dept</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Placed</th>
                  <th className="text-right py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {deptData.map((d) => (
                  <tr key={d.dept_id} className="border-b last:border-0">
                    <td className="py-2 text-gray-700 font-medium">{d.dept_code}</td>
                    <td className="py-2 text-right text-gray-700">
                      {d.total_students}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {d.placed_students}
                    </td>
                    <td className="py-2 text-right font-medium text-green-600">
                      {d.placement_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Recruiters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🏆 Top Recruiters
          </h2>
          {topRecruiters.length === 0 ? (
            <p className="text-sm text-gray-500">No placements yet.</p>
          ) : (
            <div className="space-y-3">
              {topRecruiters.map((r, idx) => (
                <div
                  key={r.company_id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {r.company_name}
                      </p>
                      <p className="text-xs text-gray-500">{r.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      {r.total_offers} offers
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{Number(r.avg_package || 0).toFixed(1)} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Company-wise summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Company-wise Placement Summary
        </h2>
        {companyData.length === 0 ? (
          <p className="text-sm text-gray-500">No placements yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">Company</th>
                <th className="text-left py-2">Industry</th>
                <th className="text-right py-2">Offers</th>
                <th className="text-right py-2">Accepted</th>
                <th className="text-right py-2">Avg Package</th>
                <th className="text-right py-2">Highest</th>
              </tr>
            </thead>
            <tbody>
              {companyData
                .filter((c) => c.total_offers > 0)
                .map((c) => (
                  <tr key={c.company_id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-800">
                      {c.company_name}
                    </td>
                    <td className="py-2 text-gray-600">{c.industry || '—'}</td>
                    <td className="py-2 text-right text-gray-700">
                      {c.total_offers}
                    </td>
                    <td className="py-2 text-right text-green-600 font-medium">
                      {c.accepted_offers}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      ₹{Number(c.avg_package || 0).toFixed(1)} L
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      ₹{c.highest_package} L
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}