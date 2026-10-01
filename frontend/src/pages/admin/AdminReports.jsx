import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const API_URL ="http://localhost:5000/api";

/* =========================
   Helpers
========================= */

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentMonth = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getCurrentYear = () => {
  return String(new Date().getFullYear());
};

const getMonthStart = (month) => {
  return `${month}-01`;
};

const getMonthEnd = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;
};

const getYearStart = (year) => {
  return `${year}-01-01`;
};

const getYearEnd = (year) => {
  return `${year}-12-31`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const calculateWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;

  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();

  if (end <= start) return 0;

  return (end - start) / (1000 * 60 * 60);
};

const formatDuration = (hours) => {
  if (hours === null || hours === undefined) return "—";

  const totalMinutes = Math.round(Number(hours) * 60);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;

  return `${h}h ${m}m`;
};

const getReportLabel = (mode, date, month, year, customStart, customEnd) => {
  if (mode === "daily") {
    return formatDate(date);
  }

  if (mode === "monthly") {
    const value = new Date(`${month}-01T00:00:00`);

    return value.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  if (mode === "yearly") {
    return year;
  }

  return `${formatDate(customStart)} → ${formatDate(customEnd)}`;
};

const getFileName = (
  mode,
  date,
  month,
  year,
  customStart,
  customEnd
) => {
  if (mode === "daily") {
    return `attendance-report-${date}`;
  }

  if (mode === "monthly") {
    return `attendance-report-${month}`;
  }

  if (mode === "yearly") {
    return `attendance-report-${year}`;
  }

  return `attendance-report-${customStart}-to-${customEnd}`;
};

/* =========================
   Status Badge
========================= */

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "late") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Late
      </span>
    );
  }

  if (normalized === "present") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Present
      </span>
    );
  }

  if (normalized === "absent") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Absent
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {status || "—"}
    </span>
  );
};

/* =========================
   Summary Card
========================= */

const SummaryCard = ({ title, value, icon, description }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================
   Main Component
========================= */

export default function AdminReports() {
  const [mode, setMode] = useState("daily");

  const [date, setDate] = useState(getToday());
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());

  const [customStart, setCustomStart] = useState(getToday());
  const [customEnd, setCustomEnd] = useState(getToday());

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [attendance, setAttendance] = useState([]);
  const [employeeReports, setEmployeeReports] = useState([]);

  const [summary, setSummary] = useState({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0,
    checkedOut: 0,
    totalWorkingHours: 0,
  });

  const [reportPeriod, setReportPeriod] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     Get Date Range
  ========================= */

  const getSelectedDateRange = () => {
    if (mode === "daily") {
      return {
        startDate: date,
        endDate: date,
      };
    }

    if (mode === "monthly") {
      return {
        startDate: getMonthStart(month),
        endDate: getMonthEnd(month),
      };
    }

    if (mode === "yearly") {
      return {
        startDate: getYearStart(year),
        endDate: getYearEnd(year),
      };
    }

    return {
      startDate: customStart,
      endDate: customEnd,
    };
  };

  /* =========================
     Fetch Report
  ========================= */

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const { startDate, endDate } = getSelectedDateRange();

      if (!startDate || !endDate) {
        throw new Error("Please select valid dates");
      }

      if (startDate > endDate) {
        throw new Error(
          "Start date cannot be greater than end date"
        );
      }

      let url = "";

      /* Daily API */
      if (mode === "daily") {
        const params = new URLSearchParams();

        params.append("date", date);

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (status) {
          params.append("status", status);
        }

        url = `${API_URL}/attendance/admin?${params.toString()}`;
      }

      /* Range API */
      else {
        const params = new URLSearchParams();

        params.append("startDate", startDate);
        params.append("endDate", endDate);

        if (search.trim()) {
          params.append("search", search.trim());
        }

        url = `${API_URL}/attendance/admin/report?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch attendance report"
        );
      }

      const records = data.attendance || [];

      /* Calculate total working hours */
      let calculatedWorkingHours = 0;

      records.forEach((record) => {
        const attendanceData =
          record?.attendance &&
            typeof record.attendance === "object"
            ? record.attendance
            : record;

        if (
          attendanceData?.checkIn &&
          attendanceData?.checkOut
        ) {
          const hours = calculateWorkingHours(
            attendanceData.checkIn,
            attendanceData.checkOut
          );

          if (hours !== null) {
            calculatedWorkingHours += hours;
          }
        }
      });

      setAttendance(records);

      setEmployeeReports(data.employeeReports || []);

      setSummary({
        totalEmployees: Number(data.summary?.totalEmployees || 0),
        present: Number(data.summary?.present || 0),
        late: Number(data.summary?.late || 0),
        absent: Number(data.summary?.absent || 0),
        checkedOut: Number(data.summary?.checkedOut || 0),
        totalWorkingHours:
          data.summary?.totalWorkingHours !== undefined &&
            data.summary?.totalWorkingHours !== null
            ? Number(data.summary.totalWorkingHours)
            : Number(calculatedWorkingHours.toFixed(2)),
      });

      setReportPeriod(
        data.period || {
          startDate,
          endDate,
          totalDays: 1,
        }
      );
    } catch (err) {
      console.error("Report Error:", err);

      setError(
        err.message || "Something went wrong while loading report"
      );

      setAttendance([]);
      setEmployeeReports([]);

      setSummary({
        totalEmployees: 0,
        present: 0,
        late: 0,
        absent: 0,
        checkedOut: 0,
        totalWorkingHours: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  /* Load today's report on first page load */
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     Employee Lookup
  ========================= */

  const employeeLookup = useMemo(() => {
    const map = new Map();

    employeeReports.forEach((item) => {
      if (item?.employee?.id) {
        map.set(String(item.employee.id), item.employee);
      }
    });

    return map;
  }, [employeeReports]);

  /* =========================
     Detailed Attendance Rows
  ========================= */

  const detailedRows = useMemo(() => {
    let rows = attendance.map((record) => {
      /*
        Daily API response:
        {
          employee: {...},
          attendance: {...}
        }

        Range API response:
        {
          employee: ObjectId,
          date: "...",
          checkIn: "...",
          ...
        }
      */

      const isDailyWrapper =
        record?.attendance &&
        typeof record.attendance === "object";

      const attendanceData = isDailyWrapper
        ? record.attendance
        : record;

      const employeeData = isDailyWrapper
        ? record.employee
        : record.employee;

      const employeeId =
        employeeData?._id ||
        employeeData?.id ||
        attendanceData?.employee?._id ||
        attendanceData?.employee?.id ||
        attendanceData?.employee;

      const employeeFromLookup = employeeLookup.get(
        String(employeeId)
      );

      const workingHours = calculateWorkingHours(
        attendanceData?.checkIn,
        attendanceData?.checkOut
      );

      return {
        id:
          attendanceData?._id ||
          attendanceData?.id ||
          record?._id ||
          record?.id,

        employeeId,

        employeeName:
          employeeData?.name ||
          attendanceData?.employee?.name ||
          employeeFromLookup?.name ||
          "Unknown Employee",

        email:
          employeeData?.email ||
          attendanceData?.employee?.email ||
          employeeFromLookup?.email ||
          "—",

        phone:
          employeeData?.phone ||
          attendanceData?.employee?.phone ||
          employeeFromLookup?.phone ||
          "—",

        date:
          attendanceData?.date ||
          record?.date ||
          null,

        checkIn:
          attendanceData?.checkIn ||
          null,

        checkOut:
          attendanceData?.checkOut ||
          null,

        workingHours,

        status:
          attendanceData?.status ||
          record?.status ||
          "present",

        faceVerified:
          attendanceData?.faceVerified === true,
      };
    });

    if (status) {
      rows = rows.filter(
        (row) =>
          String(row.status).toLowerCase() ===
          status.toLowerCase()
      );
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      rows = rows.filter((row) => {
        return (
          row.employeeName.toLowerCase().includes(query) ||
          row.email.toLowerCase().includes(query) ||
          row.phone.toLowerCase().includes(query)
        );
      });
    }

    return rows;
  }, [
    attendance,
    employeeLookup,
    search,
    status,
  ]);

  /* =========================
     Search Daily Data Locally
  ========================= */

  const filteredDetailedRows = useMemo(() => {
    if (!search.trim() || mode !== "daily") {
      return detailedRows;
    }

    const query = search.trim().toLowerCase();

    return detailedRows.filter((row) => {
      return (
        row.employeeName.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query)
      );
    });
  }, [detailedRows, search, mode]);

  /* =========================
     Employee Summary
  ========================= */

  const displayedEmployeeReports = useMemo(() => {
    if (mode !== "daily") {
      return employeeReports;
    }

    return employeeReports.map((item) => ({
      ...item,
      summary: {
        ...item.summary,
      },
    }));
  }, [employeeReports, mode]);

  /* =========================
     CSV Export
  ========================= */

  const escapeCSV = (value) => {
    const stringValue =
      value === null || value === undefined
        ? ""
        : String(value);

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const exportCSV = () => {
    if (filteredDetailedRows.length === 0) {
      alert("No attendance data available to export.");
      return;
    }

    const rows = filteredDetailedRows.map((row) => ({
      Date: row.date,
      Employee: row.employeeName,
      Email: row.email,
      Phone: row.phone,
      "Check In": formatDateTime(row.checkIn),
      "Check Out": formatDateTime(row.checkOut),
      "Working Hours":
        row.workingHours !== null
          ? row.workingHours.toFixed(2)
          : "",
      Status: row.status,
      "Face Verified": row.faceVerified ? "Yes" : "No",
    }));

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        headers.map((header) => escapeCSV(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${getFileName(
      mode,
      date,
      month,
      year,
      customStart,
      customEnd
    )}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =========================
     Excel Export
  ========================= */

  const exportExcel = () => {
    if (
      filteredDetailedRows.length === 0 &&
      displayedEmployeeReports.length === 0
    ) {
      alert("No report data available to export.");
      return;
    }

    /* Summary Sheet */

    const summaryRows = displayedEmployeeReports.map((item) => ({
      Employee: item.employee?.name || "Unknown",
      Email: item.employee?.email || "",
      Phone: item.employee?.phone || "",
      Present: item.summary?.present || 0,
      Late: item.summary?.late || 0,
      Absent: item.summary?.absent || 0,
      "Checked Out": item.summary?.checkedOut || 0,
      "Total Working Hours":
        item.summary?.totalWorkingHours || 0,
    }));

    /* Attendance Sheet */

    const attendanceRows = filteredDetailedRows.map((row) => ({
      Date: row.date,
      Employee: row.employeeName,
      Email: row.email,
      Phone: row.phone,
      "Check In": formatDateTime(row.checkIn),
      "Check Out": formatDateTime(row.checkOut),
      "Working Hours":
        row.workingHours !== null
          ? Number(row.workingHours.toFixed(2))
          : "",
      Status: row.status,
      "Face Verified": row.faceVerified ? "Yes" : "No",
    }));

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

    const attendanceSheet =
      XLSX.utils.json_to_sheet(attendanceRows);

    /* Column widths */

    summarySheet["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 22 },
    ];

    attendanceSheet["!cols"] = [
      { wch: 14 },
      { wch: 25 },
      { wch: 30 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Employee Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      attendanceSheet,
      "Attendance Details"
    );

    XLSX.writeFile(
      workbook,
      `${getFileName(
        mode,
        date,
        month,
        year,
        customStart,
        customEnd
      )}.xlsx`
    );
  };

  /* =========================
     Clear Filters
  ========================= */

  const clearFilters = () => {
    setSearch("");
    setStatus("");

    if (mode === "daily") {
      setDate(getToday());
    }

    if (mode === "monthly") {
      setMonth(getCurrentMonth());
    }

    if (mode === "yearly") {
      setYear(getCurrentYear());
    }

    if (mode === "custom") {
      setCustomStart(getToday());
      setCustomEnd(getToday());
    }
  };

  /* =========================
     Change Report Mode
  ========================= */

  const changeMode = (newMode) => {
    setMode(newMode);

    setSearch("");
    setStatus("");

    setError("");
  };

  const reportLabel = getReportLabel(
    mode,
    date,
    month,
    year,
    customStart,
    customEnd
  );

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              ADMIN PANEL
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Attendance Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Generate and export employee attendance reports
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              disabled={filteredDetailedRows.length === 0}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              📄 CSV
            </button>

            <button
              onClick={exportExcel}
              disabled={
                filteredDetailedRows.length === 0 &&
                displayedEmployeeReports.length === 0
              }
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              📊 Excel
            </button>

            <button
              onClick={fetchReport}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Report Type */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Report Period
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the period for which you want to generate
              attendance data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              {
                key: "daily",
                label: "Daily",
                icon: "📅",
              },
              {
                key: "monthly",
                label: "Monthly",
                icon: "📆",
              },
              {
                key: "yearly",
                label: "Yearly",
                icon: "🗓️",
              },
              {
                key: "custom",
                label: "Custom",
                icon: "🔧",
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => changeMode(item.key)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${mode === item.key
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Date Controls */}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            {mode === "daily" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {mode === "monthly" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Month
                </label>

                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {mode === "yearly" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Year
                </label>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from(
                    { length: 10 },
                    (_, index) =>
                      new Date().getFullYear() - index
                  ).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "custom" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) =>
                      setCustomStart(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) =>
                      setCustomEnd(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </>
            )}

            <div
              className={`flex items-end ${mode === "custom" ? "" : "md:col-span-3"
                }`}
            >
              <button
                onClick={fetchReport}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Generating..."
                  : "Generate Report"}
              </button>
            </div>
          </div>

          {/* Search + Status */}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search Employee
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Report Heading */}

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900">
            {reportLabel}
          </h2>

          {reportPeriod && (
            <p className="text-sm text-slate-500">
              {formatDate(reportPeriod.startDate)} →{" "}
              {formatDate(reportPeriod.endDate)}
              {reportPeriod.totalDays
                ? ` • ${reportPeriod.totalDays} day${reportPeriod.totalDays > 1 ? "s" : ""
                }`
                : ""}
            </p>
          )}
        </div>

        {/* Summary Cards */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            title="Employees"
            value={summary.totalEmployees}
            icon="👥"
          />

          <SummaryCard
            title="Present"
            value={summary.present}
            icon="✅"
          />

          <SummaryCard
            title="Late"
            value={summary.late}
            icon="⏰"
          />

          <SummaryCard
            title="Absent"
            value={summary.absent}
            icon="❌"
          />

          <SummaryCard
            title="Checked Out"
            value={summary.checkedOut}
            icon="🚪"
          />

          <SummaryCard
            title="Working Hours"
            value={formatDuration(
              summary.totalWorkingHours
            )}
            icon="⌛"
          />
        </div>

        {/* Employee Summary */}

        {mode !== "daily" &&
          displayedEmployeeReports.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-900">
                  Employee Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Employee-wise attendance summary for the
                  selected period.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Employee
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Present
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Late
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Absent
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Checked Out
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Working Hours
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedEmployeeReports.map(
                      (item, index) => (
                        <tr
                          key={
                            item.employee?.id ||
                            item.employee?._id ||
                            index
                          }
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {item.employee?.name ||
                                "Unknown"}
                            </div>

                            <div className="text-xs text-slate-500">
                              {item.employee?.email || "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-emerald-600">
                            {item.summary?.present || 0}
                          </td>

                          <td className="px-5 py-4 font-semibold text-amber-600">
                            {item.summary?.late || 0}
                          </td>

                          <td className="px-5 py-4 font-semibold text-red-600">
                            {item.summary?.absent || 0}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {item.summary?.checkedOut || 0}
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {formatDuration(
                              item.summary?.totalWorkingHours
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Attendance Details */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Attendance Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredDetailedRows.length} attendance record
                {filteredDetailedRows.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {reportLabel}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading attendance...
                </p>
              </div>
            </div>
          ) : filteredDetailedRows.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center px-5">
              <div className="text-center">
                <div className="text-4xl">📭</div>

                <h3 className="mt-3 font-semibold text-slate-800">
                  No attendance records found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try another date, period, employee or status
                  filter.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Date
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Employee
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Check In
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Check Out
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Working
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Status
                      </th>

                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Face
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDetailedRows.map(
                      (row, index) => (
                        <tr
                          key={row.id || index}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 text-slate-700">
                            {formatDate(row.date)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {row.employeeName}
                            </div>

                            <div className="text-xs text-slate-500">
                              {row.email}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatTime(row.checkIn)}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatTime(row.checkOut)}
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {formatDuration(
                              row.workingHours
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={row.status}
                            />
                          </td>

                          <td className="px-5 py-4">
                            {row.faceVerified ? (
                              <span className="font-semibold text-emerald-600">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-400">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}

              <div className="space-y-3 p-4 md:hidden">
                {filteredDetailedRows.map(
                  (row, index) => (
                    <div
                      key={row.id || index}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {row.employeeName}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {row.email}
                          </p>
                        </div>

                        <StatusBadge
                          status={row.status}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">
                            Date
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {formatDate(row.date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Working
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {formatDuration(
                              row.workingHours
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Check In
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {formatTime(row.checkIn)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Check Out
                          </p>

                          <p className="mt-1 font-semibold text-slate-700">
                            {formatTime(row.checkOut)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <span
                          className={`text-xs font-semibold ${row.faceVerified
                            ? "text-emerald-600"
                            : "text-slate-400"
                            }`}
                        >
                          {row.faceVerified
                            ? "✓ Face Verified"
                            : "Face Not Verified"}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Report Note */}

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="font-semibold">Report:</span>{" "}
          {reportLabel}
          {mode !== "daily" && (
            <>
              {" "}
              • Range report employee summary is based on
              attendance records available for the selected
              period.
            </>
          )}
        </div>
      </div>
    </div>
  );
}