import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";

import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

import Employees from "./pages/admin/Employees";
import EmployeeFaceRegistration from "./pages/admin/EmployeeFaceRegistration";
import SchoolLocation from "./pages/admin/SchoolLocation";

import Attendance from "./pages/employee/Attendance";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

import AdminAttendance from "./pages/admin/AdminAttendance";
import AttendanceRules from "./pages/admin/AttendanceRules";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

import History from "./pages/employee/History";
import Profile from "./pages/employee/Profile";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

// ==========================================
// LOGIN REDIRECT
// ==========================================

function LoginRedirect() {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300">
          Loading...
        </p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    if (user.role === "employee") {
      return (
        <Navigate
          to="/employee"
          replace
        />
      );
    }
  }

  return <Login />;
}

// ==========================================
// APP ROUTES
// ==========================================

function AppRoutes() {
  return (
    <Routes>

      {/* ==================================
          LOGIN
      ================================== */}

      <Route
        path="/login"
        element={<LoginRedirect />}
      />

      {/* ==================================
          ADMIN ROUTES
      ================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={["admin"]}
          >
            <AdminLayout />
          </ProtectedRoute>
        }
      >

        {/* /admin */}
        <Route
          index
          element={<AdminDashboard />}
        />

        {/* /admin/employees */}
        <Route
          path="employees"
          element={<Employees />}
        />

        {/* /admin/employees/:employeeId/face */}
        <Route
          path="employees/:employeeId/face"
          element={
            <EmployeeFaceRegistration />
          }
        />

        {/* /admin/school */}
        <Route
          path="school"
          element={<SchoolLocation />}
        />

        <Route
          path="attendance"
          element={<AdminAttendance />}
        />

        <Route
          path="attendance-rules"
          element={<AttendanceRules />}
        />

        <Route
          path="reports"
          element={<AdminReports />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />

      </Route>

      {/* ==================================
          EMPLOYEE ROUTES
      ================================== */}

      <Route
        path="/employee"
        element={
          <ProtectedRoute
            allowedRoles={["employee"]}
          >
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >

        {/* /employee */}
        <Route
          index
          element={<EmployeeDashboard />}
        />

        {/* /employee/attendance */}
        <Route
          path="attendance"
          element={<Attendance />}
        />

        <Route
          path="history"
          element={<History />}
        />

        {/* /employee/profile */}
        <Route
          path="profile"
          element={<Profile />}
        />

      </Route>

      {/* ==================================
          DEFAULT
      ================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

// ==========================================
// APP
// ==========================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;