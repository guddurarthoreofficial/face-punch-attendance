import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [todayAttendance, setTodayAttendance] =
    useState(null);

  const [recentAttendance, setRecentAttendance] =
    useState([]);

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

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // WORKING DURATION
  // ==========================================

  const calculateWorkingDuration = (
    checkIn,
    checkOut
  ) => {
    if (!checkIn) {
      return "—";
    }

    const start = new Date(checkIn);

    const end = checkOut
      ? new Date(checkOut)
      : new Date();

    const difference =
      end.getTime() - start.getTime();

    if (difference < 0) {
      return "—";
    }

    const totalMinutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
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

        const [
          todayResponse,
          historyResponse,
        ] = await Promise.all([
          apiRequest(
            "/attendance/my/today"
          ),

          apiRequest(
            "/attendance/my"
          ),
        ]);

        setTodayAttendance(
          todayResponse?.attendance || null
        );

        setRecentAttendance(
          historyResponse?.attendance || []
        );
      } catch (error) {
        console.error(
          "Employee Dashboard Error:",
          error
        );

        setError(
          error.message ||
            "Unable to load attendance data."
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
  // TODAY STATUS
  // ==========================================

  const todayStatus = useMemo(() => {
    if (!todayAttendance) {
      return {
        label: "Not Checked In",
        description:
          "You have not marked attendance today.",
        color: "amber",
        icon: "○",
      };
    }

    if (
      todayAttendance.checkIn &&
      !todayAttendance.checkOut
    ) {
      return {
        label:
          todayAttendance.status === "late"
            ? "Late — Checked In"
            : "Present",
        description:
          "You are currently checked in.",
        color:
          todayAttendance.status === "late"
            ? "amber"
            : "green",
        icon:
          todayAttendance.status === "late"
            ? "⏱"
            : "✓",
      };
    }

    return {
      label: "Day Completed",
      description:
        "You have completed today's attendance.",
      color: "blue",
      icon: "✓",
    };
  }, [todayAttendance]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <div className="h-8 w-72 bg-slate-800 rounded-lg animate-pulse" />

          <div className="h-4 w-96 max-w-full bg-slate-800 rounded mt-3 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="h-52 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />

          <div className="h-52 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />

        </div>

        <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />

      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error && !todayAttendance && recentAttendance.length === 0) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-slate-400 mt-1">
            Unable to load your attendance.
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
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // STATUS COLORS
  // ==========================================

  const statusStyles = {
    green: {
      card:
        "border-green-500/20 bg-green-500/5",
      icon:
        "bg-green-500/10 text-green-400",
      text: "text-green-400",
    },

    amber: {
      card:
        "border-amber-500/20 bg-amber-500/5",
      icon:
        "bg-amber-500/10 text-amber-400",
      text: "text-amber-400",
    },

    blue: {
      card:
        "border-blue-500/20 bg-blue-500/5",
      icon:
        "bg-blue-500/10 text-blue-400",
      text: "text-blue-400",
    },
  };

  const currentStatus =
    statusStyles[todayStatus.color];

  return (
    <div className="space-y-6">

      {/* ========================================
          WELCOME
      ======================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Good Morning,{" "}
            {user?.name || "Employee"} 👋
          </h1>

          <p className="text-slate-400 mt-1">
            Here's your attendance overview for today.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            fetchDashboardData(true)
          }
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-medium transition"
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
          TODAY STATUS + WORKING TIME
      ======================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* STATUS CARD */}

        <div
          className={`
            rounded-2xl border p-6
            ${currentStatus.card}
          `}
        >

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-slate-400">
                Today's Status
              </p>

              <h2
                className={`
                  text-2xl font-bold mt-2
                  ${currentStatus.text}
                `}
              >
                {todayStatus.label}
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                {todayStatus.description}
              </p>

            </div>

            <div
              className={`
                w-12 h-12 rounded-xl
                flex items-center justify-center
                text-xl font-bold
                ${currentStatus.icon}
              `}
            >
              {todayStatus.icon}
            </div>

          </div>

          {/* TIMES */}

          {todayAttendance && (
            <div className="grid grid-cols-2 gap-3 mt-6">

              <div className="bg-slate-950/40 rounded-xl p-4">

                <p className="text-xs text-slate-500">
                  Check In
                </p>

                <p className="text-lg font-semibold text-white mt-1">
                  {formatTime(
                    todayAttendance.checkIn
                  )}
                </p>

              </div>

              <div className="bg-slate-950/40 rounded-xl p-4">

                <p className="text-xs text-slate-500">
                  Check Out
                </p>

                <p className="text-lg font-semibold text-white mt-1">
                  {formatTime(
                    todayAttendance.checkOut
                  )}
                </p>

              </div>

            </div>
          )}

        </div>

        {/* WORKING TIME CARD */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Working Time
              </p>

              <p className="text-3xl font-bold text-white mt-2">
                {calculateWorkingDuration(
                  todayAttendance?.checkIn,
                  todayAttendance?.checkOut
                )}
              </p>

              <p className="text-sm text-slate-500 mt-2">
                {todayAttendance?.checkOut
                  ? "Today's completed duration"
                  : todayAttendance?.checkIn
                    ? "Current working duration"
                    : "No working time recorded"}
              </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">
              ⏱
            </div>

          </div>

          <div className="mt-6 pt-5 border-t border-slate-800">

            {todayAttendance?.checkIn &&
            !todayAttendance?.checkOut ? (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/employee/attendance"
                  )
                }
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Go to Check-Out →
              </button>
            ) : todayAttendance?.checkOut ? (
              <div className="w-full bg-blue-500/10 text-blue-400 py-3 rounded-xl text-center font-semibold">
                Attendance Completed ✓
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/employee/attendance"
                  )
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Mark Attendance →
              </button>
            )}

          </div>

        </div>

      </div>

      {/* ========================================
          RECENT ATTENDANCE
      ======================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        <div className="px-5 sm:px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Recent Attendance
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Your latest attendance records
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/employee/history"
              )
            }
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            View History →
          </button>

        </div>

        {recentAttendance.length === 0 ? (
          <div className="px-6 py-14 text-center">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
              📋
            </div>

            <h3 className="text-white font-semibold mt-4">
              No attendance records
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Your attendance history will appear here.
            </p>

          </div>
        ) : (

          <div className="divide-y divide-slate-800">

            {recentAttendance
              .slice(0, 5)
              .map((record) => (
                <div
                  key={record._id}
                  className="px-5 sm:px-6 py-4 hover:bg-slate-800/30 transition"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    {/* DATE + STATUS */}

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                        📅
                      </div>

                      <div>

                        <p className="text-sm font-medium text-white">
                          {formatDate(
                            record.date
                          )}
                        </p>

                        <span
                          className={`
                            inline-flex mt-1
                            px-2 py-0.5
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

                    </div>

                    {/* TIMES */}

                    <div className="grid grid-cols-3 gap-5 sm:gap-8">

                      <div>

                        <p className="text-xs text-slate-500">
                          Check In
                        </p>

                        <p className="text-sm text-slate-200 font-medium mt-1">
                          {formatTime(
                            record.checkIn
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-500">
                          Check Out
                        </p>

                        <p className="text-sm text-slate-200 font-medium mt-1">
                          {formatTime(
                            record.checkOut
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-500">
                          Duration
                        </p>

                        <p className="text-sm text-slate-200 font-medium mt-1">
                          {calculateWorkingDuration(
                            record.checkIn,
                            record.checkOut
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>
              ))}

          </div>
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
            Manage your attendance
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/employee/attendance"
              )
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition group"
          >

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">
              📍
            </div>

            <h3 className="text-white font-semibold mt-4">
              Attendance
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Verify your face and location to mark attendance.
            </p>

            <span className="inline-block text-sm text-blue-400 mt-4 group-hover:text-blue-300">
              Open Attendance →
            </span>

          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/employee/history"
              )
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 transition group"
          >

            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg">
              📋
            </div>

            <h3 className="text-white font-semibold mt-4">
              Attendance History
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Review your previous attendance records.
            </p>

            <span className="inline-block text-sm text-purple-400 mt-4 group-hover:text-purple-300">
              View History →
            </span>

          </button>

        </div>

      </div>

    </div>
  );
}

export default EmployeeDashboard;