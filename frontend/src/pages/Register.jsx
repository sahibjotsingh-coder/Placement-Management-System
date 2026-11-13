import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', rollNumber: '', deptId: 1, cgpa: '', graduationYear: 2026,
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const payload = {
      email: formData.email,
      password: formData.password,
      role,
      ...(role === 'student'
        ? {
            fullName: formData.fullName,
            rollNumber: formData.rollNumber,
            deptId: parseInt(formData.deptId),
            cgpa: parseFloat(formData.cgpa),
            graduationYear: parseInt(formData.graduationYear),
          }
        : { companyName: formData.companyName }),
    };

    try {
      const user = await register(payload);
      if (user.role === 'student') navigate('/student/dashboard');
      else navigate('/company/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join the Placement Management System</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-md font-medium transition ${
                role === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              className={`flex-1 py-2 rounded-md font-medium transition ${
                role === 'company' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏢 Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" required value={formData.email}
                  onChange={handleChange} className={inputClass} placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input name="password" type="password" required value={formData.password}
                  onChange={handleChange} className={inputClass} placeholder="Min 6 characters" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input name="confirmPassword" type="password" required value={formData.confirmPassword}
                  onChange={handleChange} className={inputClass} placeholder="Re-enter password" />
              </div>

              {role === 'student' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input name="fullName" type="text" required value={formData.fullName}
                      onChange={handleChange} className={inputClass} placeholder="Your full name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input name="rollNumber" type="text" required value={formData.rollNumber}
                      onChange={handleChange} className={inputClass} placeholder="e.g., 21CSE045" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select name="deptId" value={formData.deptId} onChange={handleChange} className={inputClass}>
                      <option value={1}>CSE</option>
                      <option value={2}>IT</option>
                      <option value={3}>ECE</option>
                      <option value={4}>MECH</option>
                      <option value={5}>EEE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                    <input name="cgpa" type="number" step="0.01" min="0" max="10" required
                      value={formData.cgpa} onChange={handleChange} className={inputClass} placeholder="e.g., 8.5" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                    <input name="graduationYear" type="number" required value={formData.graduationYear}
                      onChange={handleChange} className={inputClass} />
                  </div>
                </>
              )}

              {role === 'company' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input name="companyName" type="text" required value={formData.companyName}
                    onChange={handleChange} className={inputClass} placeholder="e.g., TCS Pvt Ltd" />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}