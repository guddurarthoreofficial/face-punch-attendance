import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import Employees from "./pages/admin/Employees";
import EmployeeFaceRegistration from "./pages/admin/EmployeeFaceRegistration";


import Attendance from "./pages/employee/Attendance";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN
        ========================= */}
        <Route
          path="/login"
          element={<LoginRedirect />}
        />

        {/* =========================
            ADMIN DASHBOARD
        ========================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees/:employeeId/face"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmployeeFaceRegistration />
            </ProtectedRoute>
          }
        />

        {/* =========================
            EMPLOYEE DASHBOARD
        ========================= */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <Attendance />
            </ProtectedRoute>
          }
        />

        {/* =========================
            DEFAULT
        ========================= */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

// Redirect logged-in users away from login page
function LoginRedirect() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (token && userData) {
    try {
      const user = JSON.parse(userData);

      if (user.role === "admin") {
        return <Navigate to="/admin" replace />;
      }

      if (user.role === "employee") {
        return <Navigate to="/employee" replace />;
      }
    } catch (error) {
      console.error("User data error:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  return <Login onLogin={() => { }} />;
}

export default App;