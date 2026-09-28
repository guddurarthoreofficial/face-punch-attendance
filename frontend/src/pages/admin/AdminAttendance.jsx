import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api";

function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAttendance = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (date) {
          params.set("date", date);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status !== "all") {
          params.set("status", status);
        }

        const data = await apiRequest(
          `/attendance/admin?${params.toString()}`
        );

        setAttendance(data?.attendance || []);
      } catch (error) {
        console.error(
          "Admin Attendance Error:",
          error
        );

        setError(
          error.message ||
            "Unable to load attendance."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date, search, status]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchAttendance]);

  const formatTime = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const calculateDuration = (
    checkIn,
    checkOut
  ) => {
    if (!checkIn) return "—";

    const start = new Date(checkIn);
    const end = checkOut
      ? new Date(checkOut)
      : null;

    if (!end) return "In progress";

    const difference =
      end.getTime() - start.getTime();

    if (difference < 0) return "—";

    const totalMinutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    return `${hours}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const summary = useMemo(() => {
    return {
      total: attendance.length,

      present: attendance.filter(
        (item) =>
          item.status === "present"
      ).length,

      late: attendance.filter(
        (item) =>
          item.status === "late"
      ).length,

      absent: attendance.filter(
        (item) =>
          item.status === "absent"
      ).length,

      checkedOut: attendance.filter(
        (item) =>
          item.attendance?.checkOut
      ).length,

      checkedIn: attendance.filter(
        (item) =>
          item.attendance?.checkIn &&
          !item.attendance?.checkOut
      ).length,
    };
  }, [attendance]);

  const getStatusStyle = (item) => {
    if (item.status === "late") {
      return {
        label: "Late",
        className:
          "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    }

    if (item.status === "present") {
      return {
        label: "Present",
        className:
          "bg-green-500/10 text-green-400 border-green-500/20",
      };
    }

    return {
      label: "Absent",
      className:
        "bg-red-500/10 text-red-400 border-red-500/20",
    };
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Attendance Management
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Monitor employee attendance and working
            hours.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAttendance(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            Employees
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {summary.total}
          </p>
        </div>

        <div className="rounded-2xl border border-green-500/10 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            Present
          </p>

          <p className="mt-2 text-2xl font-bold text-green-400">
            {summary.present}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/10 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            Late
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-400">
            {summary.late}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/10 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            Absent
          </p>

          <p className="mt-2 text-2xl font-bold text-red-400">
            {summary.absent}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/10 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            Checked In
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-400">
            {summary.checkedIn}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/10 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">
            Checked Out
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-400">
            {summary.checkedOut}
          </p>
        </div>
      </div>

      {/* FILTERS */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* DATE */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* SEARCH */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search Employee
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Name or email..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
            />
          </div>

          {/* STATUS */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            >
              <option value="all">
                All Status
              </option>

              <option value="present">
                Present
              </option>

              <option value="late">
                Late
              </option>

              <option value="absent">
                Absent
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              fetchAttendance(true)
            }
            className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
          >
            Try Again
          </button>
        </div>
      )}

      {/* DESKTOP TABLE */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:block">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">
            Attendance — {formatDate(date)}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-800"
                />
              )
            )}
          </div>
        ) : attendance.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="text-4xl">
              📋
            </div>

            <p className="mt-3 font-semibold text-white">
              No employees found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing the search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Check-In
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Check-Out
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Working Time
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Verification
                  </th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((item) => {
                  const statusStyle =
                    getStatusStyle(item);

                  return (
                    <tr
                      key={item.employee.id}
                      className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 font-bold text-blue-400">
                            {item.employee.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {item.employee.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.employee.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {formatTime(
                          item.attendance
                            ?.checkIn
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {formatTime(
                          item.attendance
                            ?.checkOut
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {calculateDuration(
                          item.attendance
                            ?.checkIn,
                          item.attendance
                            ?.checkOut
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.attendance
                          ?.faceVerified ? (
                          <span className="text-xs font-semibold text-green-400">
                            ✓ Face Verified
                          </span>
                        ) : item.attendance ? (
                          <span className="text-xs text-slate-500">
                            —
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Not marked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MOBILE CARDS */}

      <div className="space-y-3 lg:hidden">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
          <h2 className="font-semibold text-white">
            Attendance — {formatDate(date)}
          </h2>
        </div>

        {loading ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl bg-slate-900"
            />
          ))
        ) : attendance.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="text-4xl">
              📋
            </div>

            <p className="mt-3 font-semibold text-white">
              No employees found
            </p>
          </div>
        ) : (
          attendance.map((item) => {
            const statusStyle =
              getStatusStyle(item);

            return (
              <div
                key={item.employee.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 font-bold text-blue-400">
                      {item.employee.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "U"}
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {item.employee.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.employee.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyle.className}`}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-950/70 p-3">
                    <p className="text-[11px] text-slate-500">
                      Check-In
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatTime(
                        item.attendance
                          ?.checkIn
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3">
                    <p className="text-[11px] text-slate-500">
                      Check-Out
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatTime(
                        item.attendance
                          ?.checkOut
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3">
                    <p className="text-[11px] text-slate-500">
                      Working Time
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {calculateDuration(
                        item.attendance
                          ?.checkIn,
                        item.attendance
                          ?.checkOut
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3">
                    <p className="text-[11px] text-slate-500">
                      Verification
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {item.attendance
                        ?.faceVerified
                        ? "✓ Verified"
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminAttendance;