import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMobileOpen?.(false);
    navigate("/login", { replace: true });
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: "▣",
      end: true,
    },
    {
      label: "Employees",
      path: "/admin/employees",
      icon: "👥",
    },
    {
      label: "Attendance",
      path: "/admin/attendance",
      icon: "🕐",
    },
    {
      label: "School Location",
      path: "/admin/school",
      icon: "📍",
    },
    {
      label: "Reports",
      path: "/admin/reports",
      icon: "📊",
    },
    {
      label: "Settings",
      path: "/admin/settings",
      icon: "⚙️",
    },
  ];

  return (
    <>
      {/* ==========================================
          MOBILE OVERLAY
      ========================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-72
          bg-slate-900
          border-r border-slate-800
          flex flex-col
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* ========================================
            BRAND
        ======================================== */}

        <div className="h-20 px-5 flex items-center border-b border-slate-800">

          <div className="flex items-center gap-3 min-w-0">

            <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-xl">
                🏫
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-white font-bold text-base truncate">
                School Attendance
              </h1>

              <p className="text-xs text-slate-400 mt-0.5">
                Administration
              </p>
            </div>

          </div>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-white text-xl"
            aria-label="Close sidebar"
          >
            ×
          </button>

        </div>

        {/* ========================================
            NAVIGATION
        ======================================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `
                  group flex items-center gap-3
                  px-3 py-3
                  rounded-xl
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`
                        w-9 h-9
                        rounded-lg
                        flex items-center justify-center
                        text-base
                        transition
                        ${
                          isActive
                            ? "bg-white/10"
                            : "bg-slate-800 group-hover:bg-slate-700"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

          </div>

        </nav>

        {/* ========================================
            USER SECTION
        ======================================== */}

        <div className="border-t border-slate-800 p-3">

          <div className="flex items-center gap-3 px-3 py-3 mb-2">

            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold text-white truncate">
                {user?.name || "Administrator"}
              </p>

              <p className="text-xs text-slate-400 truncate">
                {user?.email || "Admin Account"}
              </p>

            </div>

          </div>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <span className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              ↪
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>
    </>
  );
}

export default AdminSidebar;
