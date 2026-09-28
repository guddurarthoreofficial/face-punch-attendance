import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import DashboardHeader from "../components/layout/DashboardHeader";

function EmployeeLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  // ==========================================
  // PAGE INFORMATION
  // ==========================================

  const getPageInfo = () => {
    const path = location.pathname;

    if (
      path === "/employee" ||
      path === "/employee/"
    ) {
      return {
        title: "Dashboard",
        subtitle:
          "Overview of your attendance",
      };
    }

    if (
      path === "/employee/attendance"
    ) {
      return {
        title: "My Attendance",
        subtitle:
          "Mark and manage your daily attendance",
      };
    }

    if (
      path === "/employee/history"
    ) {
      return {
        title: "Attendance History",
        subtitle:
          "View your previous attendance records",
      };
    }

    if (
      path === "/employee/profile"
    ) {
      return {
        title: "My Profile",
        subtitle:
          "View and manage your profile",
      };
    }

    return {
      title: "Employee Portal",
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

      <EmployeeSidebar
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

export default EmployeeLayout;