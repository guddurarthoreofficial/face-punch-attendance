import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function History() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ==========================================
  // WORKING HOURS
  // ==========================================

  const calculateWorkingDuration = (checkIn, checkOut) => {
    if (!checkIn) return "—";

    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();

    const difference = end.getTime() - start.getTime();

    if (difference < 0) return "—";

    const totalMinutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  // ==========================================
  // FETCH ATTENDANCE
  // ==========================================

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await apiRequest("/attendance/my");

      setAttendance(response?.attendance || []);
    } catch (error) {
      console.error("Employee Attendance History Error:", error);

      setError(
        error.message || "Unable to load attendance history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ==========================================
  // MONTH FILTER
  // ==========================================

  const filteredAttendance = useMemo(() => {
    if (!selectedMonth) {
      return attendance;
    }

    return attendance.filter((record) => {
      if (!record.date) return false;

      return record.date.startsWith(selectedMonth);
    });
  }, [attendance, selectedMonth]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const present = filteredAttendance.filter(
      (record) => record.status === "present"
    ).length;

    const late = filteredAttendance.filter(
      (record) => record.status === "late"
    ).length;

    const completed = filteredAttendance.filter(
      (record) => record.checkIn && record.checkOut
    ).length;

    return {
      total: filteredAttendance.length,
      present,
      late,
      completed,
    };
  }, [filteredAttendance]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />

          <div className="h-4 w-80 max-w-full bg-slate-800 rounded mt-3 animate-pulse" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>

          <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl mt-6 animate-pulse" />

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="bg-slate-900 border-b border-slate-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Attendance History
              </h1>

              <p className="text-sm text-slate-400 mt-1">
                View your previous attendance records
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => fetchAttendance(true)}
                disabled={refreshing}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 px-4 py-2.5 rounded-xl font-medium transition"
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/employee")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl font-medium transition"
              >
                Dashboard
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ERROR */}

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* ==========================================
            FILTER
        ========================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">

            <div className="flex-1">

              <label className="block text-sm text-slate-400 mb-2">
                Filter by Month
              </label>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
              />

            </div>

            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth("")}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Clear Filter
              </button>
            )}

          </div>

        </div>

        {/* ==========================================
            SUMMARY
        ========================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Total Records
            </p>

            <p className="text-2xl font-bold text-white mt-2">
              {summary.total}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Present
            </p>

            <p className="text-2xl font-bold text-green-400 mt-2">
              {summary.present}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Late
            </p>

            <p className="text-2xl font-bold text-amber-400 mt-2">
              {summary.late}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Completed
            </p>

            <p className="text-2xl font-bold text-blue-400 mt-2">
              {summary.completed}
            </p>
          </div>

        </div>

        {/* ==========================================
            ATTENDANCE TABLE
        ========================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          <div className="px-5 sm:px-6 py-5 border-b border-slate-800">

            <h2 className="text-lg font-semibold">
              Attendance Records
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {selectedMonth
                ? `Showing records for ${selectedMonth}`
                : "Showing all available attendance records"}
            </p>

          </div>

          {filteredAttendance.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
                📋
              </div>

              <h3 className="text-white font-semibold mt-5">
                No attendance records
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                No attendance records found for the selected period.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px]">

                <thead className="bg-slate-950/60">

                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-5 sm:px-6 py-4">
                      Date
                    </th>

                    <th className="px-5 sm:px-6 py-4">
                      Status
                    </th>

                    <th className="px-5 sm:px-6 py-4">
                      Check In
                    </th>

                    <th className="px-5 sm:px-6 py-4">
                      Check Out
                    </th>

                    <th className="px-5 sm:px-6 py-4">
                      Working Hours
                    </th>

                    <th className="px-5 sm:px-6 py-4">
                      Verification
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {filteredAttendance.map((record) => (

                    <tr
                      key={record._id}
                      className="hover:bg-slate-800/30 transition"
                    >

                      <td className="px-5 sm:px-6 py-4">
                        <p className="text-sm font-medium text-white">
                          {formatDate(record.date)}
                        </p>
                      </td>

                      <td className="px-5 sm:px-6 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            record.status === "late"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-green-500/10 text-green-400"
                          }`}
                        >
                          {record.status === "late"
                            ? "Late"
                            : "Present"}
                        </span>

                      </td>

                      <td className="px-5 sm:px-6 py-4">

                        <p className="text-sm text-slate-200">
                          {formatTime(record.checkIn)}
                        </p>

                      </td>

                      <td className="px-5 sm:px-6 py-4">

                        <p className="text-sm text-slate-200">
                          {formatTime(record.checkOut)}
                        </p>

                      </td>

                      <td className="px-5 sm:px-6 py-4">

                        <p className="text-sm text-slate-200">
                          {calculateWorkingDuration(
                            record.checkIn,
                            record.checkOut
                          )}
                        </p>

                      </td>

                      <td className="px-5 sm:px-6 py-4">

                        {record.faceVerified ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">
                            ✓ Face Verified
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                            —
                          </span>
                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

export default History;