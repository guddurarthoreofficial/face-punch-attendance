import { useAuth } from "../../context/AuthContext";

function DashboardHeader({
  title,
  subtitle,
  onMenuClick,
}) {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30">

      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* ========================================
            LEFT
        ======================================== */}

        <div className="flex items-center gap-3 min-w-0">

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition"
            aria-label="Open navigation menu"
          >
            <span className="text-xl">
              ☰
            </span>
          </button>

          {/* TITLE */}

          <div className="min-w-0">

            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {title}
            </h2>

            {subtitle && (
              <p className="hidden sm:block text-xs sm:text-sm text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}

          </div>

        </div>

        {/* ========================================
            RIGHT
        ======================================== */}

        <div className="flex items-center gap-2 sm:gap-4">

          {/* NOTIFICATION */}

          <button
            type="button"
            className="relative w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            aria-label="Notifications"
          >
            <span className="text-lg">
              🔔
            </span>

            {/* Notification indicator */}

            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-800" />
          </button>

          {/* DIVIDER */}

          <div className="hidden sm:block w-px h-8 bg-slate-800" />

          {/* USER */}

          <div className="flex items-center gap-3">

            <div className="hidden sm:block text-right">

              <p className="text-sm font-semibold text-white max-w-32 truncate">
                {user?.name || "User"}
              </p>

              <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase">
                {user?.role || "User"}
              </span>

            </div>

            {/* AVATAR */}

            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

          </div>

        </div>

      </div>

    </header>
  );
}

export default DashboardHeader;