import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "../components/layout/AdminSidebar";
import DashboardHeader from "../components/layout/DashboardHeader";

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  // ==========================================
  // PAGE INFORMATION
  // ==========================================

  const getPageInfo = () => {
    const path = location.pathname;

    if (
      path === "/admin" ||
      path === "/admin/"
    ) {
      return {
        title: "Dashboard",
        subtitle:
          "Overview of your school attendance system",
      };
    }

    if (
      path === "/admin/employees"
    ) {
      return {
        title: "Employees",
        subtitle:
          "Manage school employees and face registration",
      };
    }

    if (
      path.includes("/admin/employees/") &&
      path.endsWith("/face")
    ) {
      return {
        title: "Face Registration",
        subtitle:
          "Register and manage employee face verification",
      };
    }

    if (
      path === "/admin/attendance"
    ) {
      return {
        title: "Attendance",
        subtitle:
          "Monitor employee attendance",
      };
    }

    if (
      path === "/admin/school"
    ) {
      return {
        title: "School Location",
        subtitle:
          "Manage school GPS and attendance settings",
      };
    }

    if (
      path === "/admin/reports"
    ) {
      return {
        title: "Reports",
        subtitle:
          "View and export attendance reports",
      };
    }

    if (
      path === "/admin/settings"
    ) {
      return {
        title: "Settings",
        subtitle:
          "Manage system settings",
      };
    }

    return {
      title: "Administration",
      subtitle:
        "School Attendance Management System",
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <AdminSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* ========================================
          MAIN AREA
      ======================================== */}

      <div className="lg:pl-72 min-h-screen">

        {/* ======================================
            HEADER
        ====================================== */}

        <DashboardHeader
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        {/* ======================================
            PAGE CONTENT
        ====================================== */}

        <main className="p-4 sm:p-6 lg:p-8">

          <Outlet />

        </main>

      </div>

    </div>
  );
}

export default AdminLayout;