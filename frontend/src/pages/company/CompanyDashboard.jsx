import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Loading from '../../components/Loading';
import api from '../../api/axios';

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, jobsRes] = await Promise.all([
          api.get('/companies/me'),
          api.get('/companies/me/jobs'),
        ]);
        setCompany(profileRes.data.data);
        setJobs(jobsRes.data.data);
      } catch (err) {
        console.error('Company dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const totalJobs = jobs.length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0);
  const openJobs = jobs.filter((j) => j.status === 'Open').length;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome, {company?.company_name}! 🏢
      </h1>
      <p className="text-gray-600 mb-6">
        {company?.industry || 'Company Dashboard'}
        {company?.is_verified ? (
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            ✅ Verified
          </span>
        ) : (
          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            ⏳ Awaiting Verification
          </span>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Jobs Posted</p>
          <p className="text-3xl font-bold text-blue-600">{totalJobs}</p>
          <p className="text-xs text-gray-500 mt-2">{openJobs} open</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Applications</p>
          <p className="text-3xl font-bold text-indigo-600">{totalApplications}</p>
          <p className="text-xs text-gray-500 mt-2">across all jobs</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Placements</p>
          <p className="text-3xl font-bold text-green-600">{company?.total_placements || 0}</p>
          <p className="text-xs text-gray-500 mt-2">students hired</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/company/jobs/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            ➕ Post a New Job
          </Link>
          <Link
            to="/company/jobs"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            💼 Manage Jobs
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}