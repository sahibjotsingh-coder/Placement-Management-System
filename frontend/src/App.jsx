import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ============================================
// PUBLIC PAGES
// ============================================
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// ============================================
// SHARED PAGES (all authenticated roles)
// ============================================
import Notifications from './pages/Notifications';

// ============================================
// STUDENT PAGES
// ============================================
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import BrowseJobs from './pages/student/BrowseJobs';
import JobDetails from './pages/student/JobDetails';
import MyApplications from './pages/student/MyApplications';

// ============================================
// COMPANY PAGES
// ============================================
import CompanyDashboard from './pages/company/CompanyDashboard';
import MyJobs from './pages/company/MyJobs';
import PostJob from './pages/company/PostJob';
import JobApplicants from './pages/company/JobApplicants';
import ManageRounds from './pages/company/ManageRounds';

// ============================================
// ADMIN PAGES
// ============================================
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageCompanies from './pages/admin/ManageCompanies';
import AllJobs from './pages/admin/AllJobs';
import ApplicationManagement from './pages/admin/ApplicationManagement';
import Reports from './pages/admin/Reports';

// ============================================
// APP
// ============================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ============ PUBLIC ROUTES ============ */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ============ SHARED ROUTES (any logged-in user) ============ */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['student', 'company', 'admin']}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* ============ STUDENT ROUTES ============ */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <BrowseJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* ============ COMPANY ROUTES ============ */}
          <Route
            path="/company/dashboard"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <MyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs/:id/applicants"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <JobApplicants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs/:id/rounds"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <ManageRounds />
              </ProtectedRoute>
            }
          />

          {/* ============ ADMIN ROUTES ============ */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ApplicationManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* ============ FALLBACK ============ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;