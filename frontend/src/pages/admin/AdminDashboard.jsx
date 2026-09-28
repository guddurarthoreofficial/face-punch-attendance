import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [statsResponse, attendanceResponse] =
          await Promise.all([
            apiRequest(
              "/attendance/admin/stats"
            ),

            apiRequest(
              "/attendance/admin/today"
            ),
          ]);

        setStats(
          statsResponse?.stats || null
        );

        setTodayAttendance(
          attendanceResponse?.attendance || []
        );
      } catch (error) {
        console.error(
          "Admin Dashboard Error:",
          error
        );

        setError(
          error.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <div className="h-8 w-56 bg-slate-800 rounded-lg animate-pulse" />

          <div className="h-4 w-80 bg-slate-800 rounded mt-3 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-36 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
              />
            )
          )}

        </div>

        <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />

      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error && !stats) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-slate-400 mt-1">
            Unable to load attendance overview.
          </p>
        </div>

        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-6">

          <p className="text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              fetchDashboardData()
            }
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // STAT CARDS
  // ==========================================

  const statCards = [
    {
      label: "Total Employees",
      value: stats?.totalEmployees ?? 0,
      icon: "👥",
      description: "Active employees",
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-400",
    },
    {
      label: "Present Today",
      value: stats?.presentToday ?? 0,
      icon: "✓",
      description: "Employees present",
      iconBg: "bg-green-500/10",
      iconText: "text-green-400",
    },
    {
      label: "Absent Today",
      value: stats?.absentToday ?? 0,
      icon: "×",
      description: "No attendance marked",
      iconBg: "bg-red-500/10",
      iconText: "text-red-400",
    },
    {
      label: "Late Today",
      value: stats?.lateToday ?? 0,
      icon: "⏱",
      description: "Late attendance",
      iconBg: "bg-amber-500/10",
      iconText: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ========================================
          PAGE INTRO
      ======================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-slate-400 mt-1">
            Here's today's attendance overview.
          </p>

          {stats?.date && (
            <p className="text-xs text-slate-500 mt-2">
              {formatDate(
                `${stats.date}T00:00:00`
              )}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            fetchDashboardData(true)
          }
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-medium transition"
        >
          <span
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          >
            ↻
          </span>

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ========================================
          ERROR BANNER
      ======================================== */}

      {error && (
        <div className="bg-amber-950/40 border border-amber-800 text-amber-300 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ========================================
          STAT CARDS
      ======================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-slate-400">
                  {card.label}
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {card.value}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  {card.description}
                </p>

              </div>

              <div
                className={`
                  w-11 h-11 rounded-xl
                  flex items-center justify-center
                  text-lg font-bold
                  ${card.iconBg}
                  ${card.iconText}
                `}
              >
                {card.icon}
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* ========================================
          LIVE STATUS
      ======================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Currently Checked In
              </p>

              <p className="text-3xl font-bold text-green-400 mt-2">
                {stats?.currentlyCheckedIn ?? 0}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Employees currently at work
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
              🟢
            </div>

          </div>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Checked Out Today
              </p>

              <p className="text-3xl font-bold text-blue-400 mt-2">
                {stats?.checkedOutToday ?? 0}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Employees who completed checkout
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              🔵
            </div>

          </div>

        </div>

      </div>

      {/* ========================================
          TODAY'S ATTENDANCE
      ======================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="px-5 sm:px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Today's Attendance
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {todayAttendance.length} attendance record
              {todayAttendance.length !== 1
                ? "s"
                : ""}{" "}
              today
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/attendance")
            }
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            View all →
          </button>

        </div>

        {/* EMPTY STATE */}

        {todayAttendance.length === 0 ? (
          <div className="px-6 py-16 text-center">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
              📋
            </div>

            <h3 className="text-white font-semibold mt-4">
              No attendance yet
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              No employee has marked attendance today.
            </p>

          </div>
        ) : (

          <>
            {/* DESKTOP TABLE */}

            <div className="hidden md:block overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-slate-800 text-left">

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Employee
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Check In
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Check Out
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {todayAttendance.map(
                    (record) => (
                      <tr
                        key={record._id}
                        className="border-b border-slate-800/70 last:border-b-0 hover:bg-slate-800/30 transition"
                      >

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-semibold">
                              {record.employee?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </div>

                            <div>

                              <p className="text-sm font-medium text-white">
                                {record.employee?.name ||
                                  "Unknown Employee"}
                              </p>

                              <p className="text-xs text-slate-500 mt-0.5">
                                {record.employee?.email ||
                                  "—"}
                              </p>

                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatTime(
                            record.checkIn
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatTime(
                            record.checkOut
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`
                              inline-flex items-center
                              px-2.5 py-1
                              rounded-full
                              text-xs font-semibold
                              ${
                                record.status ===
                                "late"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-green-500/10 text-green-400"
                              }
                            `}
                          >
                            {record.status ===
                            "late"
                              ? "Late"
                              : "Present"}
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE CARDS */}

            <div className="md:hidden divide-y divide-slate-800">

              {todayAttendance.map(
                (record) => (
                  <div
                    key={record._id}
                    className="p-5"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-semibold">
                          {record.employee?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "?"}
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-medium text-white truncate">
                            {record.employee?.name ||
                              "Unknown Employee"}
                          </p>

                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {record.employee?.email ||
                              "—"}
                          </p>

                        </div>

                      </div>

                      <span
                        className={`
                          shrink-0
                          px-2.5 py-1
                          rounded-full
                          text-xs font-semibold
                          ${
                            record.status ===
                            "late"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-green-500/10 text-green-400"
                          }
                        `}
                      >
                        {record.status ===
                        "late"
                          ? "Late"
                          : "Present"}
                      </span>

                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">

                      <div className="bg-slate-800/60 rounded-xl p-3">

                        <p className="text-xs text-slate-500">
                          Check In
                        </p>

                        <p className="text-sm text-slate-200 font-medium mt-1">
                          {formatTime(
                            record.checkIn
                          )}
                        </p>

                      </div>

                      <div className="bg-slate-800/60 rounded-xl p-3">

                        <p className="text-xs text-slate-500">
                          Check Out
                        </p>

                        <p className="text-sm text-slate-200 font-medium mt-1">
                          {formatTime(
                            record.checkOut
                          )}
                        </p>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          </>
        )}

      </div>

      {/* ========================================
          QUICK ACTIONS
      ======================================== */}

      <div>

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-white">
            Quick Actions
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Common management tasks
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <button
            type="button"
            onClick={() =>
              navigate("/admin/employees")
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">
              👥
            </div>

            <h3 className="text-white font-semibold mt-4">
              Manage Employees
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Add employees and manage face registration.
            </p>

            <span className="inline-block text-sm text-blue-400 mt-4 group-hover:text-blue-300">
              Open Employees →
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/attendance")
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-green-500/50 rounded-2xl p-5 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-lg">
              🕐
            </div>

            <h3 className="text-white font-semibold mt-4">
              Attendance
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              View and manage employee attendance records.
            </p>

            <span className="inline-block text-sm text-green-400 mt-4 group-hover:text-green-300">
              View Attendance →
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/school")
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg">
              📍
            </div>

            <h3 className="text-white font-semibold mt-4">
              School Location
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Configure GPS radius and accuracy settings.
            </p>

            <span className="inline-block text-sm text-purple-400 mt-4 group-hover:text-purple-300">
              Manage Location →
            </span>
          </button>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;