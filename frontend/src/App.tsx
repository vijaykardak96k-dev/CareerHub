import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Landing } from './pages/public/Landing';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { PublicJobs } from './pages/public/PublicJobs';
import { PublicJobDetail } from './pages/public/PublicJobDetail';
import { PublicInternships } from './pages/public/PublicInternships';
import { NotificationsPage } from './pages/Notifications';

import { StudentDashboardPage } from './pages/student/Dashboard';
import { StudentProfilePage } from './pages/student/Profile';
import { StudentJobsPage } from './pages/student/Jobs';
import { StudentInternshipsPage } from './pages/student/Internships';
import { StudentApplicationsPage } from './pages/student/Applications';
import { StudentSkillsPage } from './pages/student/Skills';
import { StudentAssessmentsPage } from './pages/student/Assessments';
import { StudentCertificatesPage } from './pages/student/Certificates';
import { StudentResumePage } from './pages/student/Resume';

import { CompanyDashboardPage } from './pages/company/Dashboard';
import { CompanyProfilePage } from './pages/company/Profile';
import { CompanyJobsPage } from './pages/company/Jobs';
import { CompanyJobCreatePage } from './pages/company/JobCreate';
import { CompanyInternshipsPage } from './pages/company/Internships';
import { CompanyApplicationsPage } from './pages/company/Applications';

import { AdminDashboardPage } from './pages/admin/Dashboard';
import { AdminStudentsPage } from './pages/admin/Students';
import { AdminCompaniesPage } from './pages/admin/Companies';
import { AdminJobsPage, AdminInternshipsPage, AdminApplicationsPage } from './pages/admin/Openings';
import { AdminSkillsPage } from './pages/admin/Skills';
import { AdminAssessmentsPage } from './pages/admin/Assessments';
import { AdminCertificatesPage } from './pages/admin/Certificates';
import { AdminAnalyticsPage } from './pages/admin/Analytics';

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-900">That page does not exist</h1>
      <p className="max-w-md text-sm text-slate-500">
        The link may be out of date. Head back to the home page and try again from there.
      </p>
      <a href="/" className="btn-primary mt-2">
        Back to home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<PublicJobs />} />
            <Route path="/jobs/:id" element={<PublicJobDetail />} />
            <Route path="/internships" element={<PublicInternships />} />

            {/* Student */}
            <Route element={<ProtectedRoute roles={['STUDENT']} />}>
              <Route element={<AppLayout />}>
                <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/student/dashboard" element={<StudentDashboardPage />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
                <Route path="/student/jobs" element={<StudentJobsPage />} />
                <Route path="/student/internships" element={<StudentInternshipsPage />} />
                <Route path="/student/applications" element={<StudentApplicationsPage />} />
                <Route path="/student/skills" element={<StudentSkillsPage />} />
                <Route path="/student/assessments" element={<StudentAssessmentsPage />} />
                <Route path="/student/certificates" element={<StudentCertificatesPage />} />
                <Route path="/student/resume" element={<StudentResumePage />} />
                <Route path="/student/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Company */}
            <Route element={<ProtectedRoute roles={['COMPANY']} />}>
              <Route element={<AppLayout />}>
                <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
                <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
                <Route path="/company/profile" element={<CompanyProfilePage />} />
                <Route path="/company/jobs" element={<CompanyJobsPage />} />
                <Route path="/company/jobs/create" element={<CompanyJobCreatePage />} />
                <Route path="/company/internships" element={<CompanyInternshipsPage />} />
                <Route path="/company/applications" element={<CompanyApplicationsPage />} />
                <Route path="/company/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* College administrator */}
            <Route element={<ProtectedRoute roles={['COLLEGE_ADMIN']} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                <Route path="/admin/jobs" element={<AdminJobsPage />} />
                <Route path="/admin/internships" element={<AdminInternshipsPage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/skills" element={<AdminSkillsPage />} />
                <Route path="/admin/assessments" element={<AdminAssessmentsPage />} />
                <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
