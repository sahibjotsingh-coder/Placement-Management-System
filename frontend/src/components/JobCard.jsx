import { Link } from 'react-router-dom';

export default function JobCard({ job, showApply = false, onApply }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{job.job_title}</h3>
          <p className="text-sm text-gray-600">{job.company_name}</p>
        </div>
        <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
          ₹{job.package_lpa} LPA
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
        <span className="bg-gray-100 px-2 py-1 rounded">📍 {job.location || 'N/A'}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">{job.job_type}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">Min CGPA: {job.min_cgpa}</span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {job.job_description?.slice(0, 120)}...
      </p>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Deadline: {new Date(job.deadline).toLocaleDateString()}
        </span>
        {showApply ? (
          <button
            onClick={() => onApply(job.job_id)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
          >
            Apply
          </button>
        ) : (
          <Link
            to={`/student/jobs/${job.job_id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details →
          </Link>
        )}
      </div>
    </div>
  );
}