import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

const WEEK_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function AttendanceRules() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    checkInTime: "09:00",
    lateAfterMinutes: 15,
    minimumWorkingHours: 8,
    allowEarlyCheckout: false,
  });

  // ==========================================
  // WORKING DAYS
  // ==========================================

  const [weeklyOffDays, setWeeklyOffDays] = useState([0]);

  // ==========================================
  // HOLIDAYS
  // ==========================================

  const [holidays, setHolidays] = useState([]);

  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");

  // ==========================================
  // UI STATES
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // GET SCHOOL SETTINGS
  // ==========================================

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/school");

      const school = data.school;

      const rules = school.attendanceRules || {};

      setForm({
        checkInTime:
          rules.checkInTime || "09:00",

        lateAfterMinutes:
          rules.lateAfterMinutes ?? 15,

        minimumWorkingHours:
          rules.minimumWorkingHours ?? 8,

        allowEarlyCheckout:
          rules.allowEarlyCheckout ?? false,
      });

      setWeeklyOffDays(
        Array.isArray(school.weeklyOffDays)
          ? school.weeklyOffDays
          : [0]
      );

      setHolidays(
        Array.isArray(school.holidays)
          ? school.holidays
          : []
      );
    } catch (error) {
      console.error(
        "Get Attendance Rules Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load attendance settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // WEEKLY OFF TOGGLE
  // ==========================================

  const handleWeeklyOffChange = (day) => {
    setWeeklyOffDays((previous) => {
      if (previous.includes(day)) {
        return previous.filter(
          (item) => item !== day
        );
      }

      return [...previous, day].sort(
        (a, b) => a - b
      );
    });

    setError("");
    setSuccess("");
  };

  // ==========================================
  // ADD HOLIDAY
  // ==========================================

  const handleAddHoliday = () => {
    setError("");
    setSuccess("");

    if (!holidayDate) {
      setError("Please select a holiday date.");
      return;
    }

    if (!holidayName.trim()) {
      setError("Please enter a holiday name.");
      return;
    }

    const alreadyExists = holidays.some(
      (holiday) =>
        holiday.date === holidayDate
    );

    if (alreadyExists) {
      setError(
        "A holiday already exists for this date."
      );
      return;
    }

    setHolidays((previous) => [
      ...previous,
      {
        date: holidayDate,
        name: holidayName.trim(),
      },
    ].sort((a, b) =>
      a.date.localeCompare(b.date)
    ));

    setHolidayDate("");
    setHolidayName("");
  };

  // ==========================================
  // DELETE HOLIDAY
  // ==========================================

  const handleDeleteHoliday = (date) => {
    setHolidays((previous) =>
      previous.filter(
        (holiday) => holiday.date !== date
      )
    );

    setError("");
    setSuccess("");
  };

  // ==========================================
  // SAVE ALL SETTINGS
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const lateAfterMinutes = Number(
      form.lateAfterMinutes
    );

    const minimumWorkingHours = Number(
      form.minimumWorkingHours
    );

    // ------------------------------
    // VALIDATION
    // ------------------------------

    if (!form.checkInTime) {
      setError(
        "Check-in time is required."
      );
      return;
    }

    if (
      !Number.isFinite(
        lateAfterMinutes
      ) ||
      lateAfterMinutes < 0 ||
      lateAfterMinutes > 180
    ) {
      setError(
        "Late threshold must be between 0 and 180 minutes."
      );
      return;
    }

    if (
      !Number.isFinite(
        minimumWorkingHours
      ) ||
      minimumWorkingHours < 1 ||
      minimumWorkingHours > 24
    ) {
      setError(
        "Minimum working hours must be between 1 and 24."
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * Existing SchoolLocation page also uses
       * PUT /school.
       *
       * Fetch current school first so that
       * location settings are preserved.
       */

      const currentData =
        await apiRequest("/school");

      const school =
        currentData.school;

      const data = await apiRequest(
        "/school",
        {
          method: "PUT",

          body: JSON.stringify({
            name: school.name,

            latitude: school.latitude,

            longitude: school.longitude,

            radius: school.radius,

            gpsAccuracyLimit:
              school.gpsAccuracyLimit,

            attendanceRules: {
              checkInTime:
                form.checkInTime,

              lateAfterMinutes,

              minimumWorkingHours,

              allowEarlyCheckout:
                form.allowEarlyCheckout,
            },

            weeklyOffDays,

            holidays,
          }),
        }
      );

      const updatedSchool =
        data.school;

      const updatedRules =
        updatedSchool.attendanceRules || {};

      setForm({
        checkInTime:
          updatedRules.checkInTime ||
          "09:00",

        lateAfterMinutes:
          updatedRules.lateAfterMinutes ??
          15,

        minimumWorkingHours:
          updatedRules.minimumWorkingHours ??
          8,

        allowEarlyCheckout:
          updatedRules.allowEarlyCheckout ??
          false,
      });

      setWeeklyOffDays(
        Array.isArray(
          updatedSchool.weeklyOffDays
        )
          ? updatedSchool.weeklyOffDays
          : [0]
      );

      setHolidays(
        Array.isArray(
          updatedSchool.holidays
        )
          ? updatedSchool.holidays
          : []
      );

      setSuccess(
        "Attendance settings updated successfully ✅"
      );
    } catch (error) {
      console.error(
        "Update Attendance Settings Error:",
        error
      );

      setError(
        error.message ||
          "Failed to update attendance settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">
          Loading attendance settings...
        </p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Attendance Rules
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Configure attendance, working days and
            holiday policies.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/school")
          }
          className="w-fit rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          ← School Location
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3">
          <p className="text-sm text-green-300">
            {success}
          </p>
        </div>
      )}

      {/* ======================================
          WORKING HOURS POLICY
      ======================================= */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 lg:p-8"
      >

        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
              ⏰
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Working Hours Policy
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                These rules are applied automatically
                when employees check in and check out.
              </p>
            </div>
          </div>
        </div>

        {/* CHECK-IN TIME */}

        <div className="mt-7">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Official Check-In Time
          </label>

          <input
            type="time"
            name="checkInTime"
            value={form.checkInTime}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 sm:max-w-md"
          />

          <p className="mt-2 text-xs text-slate-500">
            Employees arriving after the configured
            late threshold will automatically be marked
            as late.
          </p>
        </div>

        {/* TWO COLUMNS */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          {/* LATE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Late After
            </label>

            <div className="relative">
              <input
                type="number"
                name="lateAfterMinutes"
                value={
                  form.lateAfterMinutes
                }
                onChange={handleChange}
                min="0"
                max="180"
                step="1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition focus:border-blue-500"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                minutes
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Example: 15 means 09:16 will be marked
              late when check-in time is 09:00.
            </p>
          </div>

          {/* MINIMUM HOURS */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Minimum Working Hours
            </label>

            <div className="relative">
              <input
                type="number"
                name="minimumWorkingHours"
                value={
                  form.minimumWorkingHours
                }
                onChange={handleChange}
                min="1"
                max="24"
                step="0.5"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition focus:border-blue-500"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                hours
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Employees must complete this duration
              before normal checkout.
            </p>
          </div>
        </div>

        {/* EARLY CHECKOUT */}

        <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">
                Allow Early Checkout
              </h3>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                When enabled, employees can check out
                before completing the minimum working
                hours.
              </p>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="allowEarlyCheckout"
                checked={
                  form.allowEarlyCheckout
                }
                onChange={handleChange}
                className="peer sr-only"
              />

              <div className="h-7 w-12 rounded-full bg-slate-700 transition peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 after:absolute after:left-[3px] after:top-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </div>

        {/* ======================================
            WEEKLY OFF DAYS
        ======================================= */}

        <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
              📅
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Weekly Off Days
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the days when the school is normally
                closed every week.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {WEEK_DAYS.map((day) => {
              const selected =
                weeklyOffDays.includes(
                  day.value
                );

              return (
                <label
                  key={day.value}
                  className={`cursor-pointer rounded-xl border p-3 text-center transition ${
                    selected
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      handleWeeklyOffChange(
                        day.value
                      )
                    }
                    className="sr-only"
                  />

                  <div
                    className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                      selected
                        ? "border-purple-500 bg-purple-600 text-white"
                        : "border-slate-600"
                    }`}
                  >
                    {selected && "✓"}
                  </div>

                  <p
                    className={`mt-2 text-sm font-medium ${
                      selected
                        ? "text-purple-300"
                        : "text-slate-400"
                    }`}
                  >
                    {day.label}
                  </p>
                </label>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Selected days will not count as working days
            and employees will not be marked absent on them.
          </p>
        </div>

        {/* ======================================
            HOLIDAY MANAGEMENT
        ======================================= */}

        <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
              🎉
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Holiday Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add school holidays so they are excluded
                from working-day and absence calculations.
              </p>
            </div>
          </div>

          {/* ADD HOLIDAY */}

          <div className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_auto]">

            <input
              type="date"
              value={holidayDate}
              onChange={(e) =>
                setHolidayDate(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />

            <input
              type="text"
              value={holidayName}
              onChange={(e) =>
                setHolidayName(
                  e.target.value
                )
              }
              placeholder="Holiday name e.g. Diwali"
              maxLength={100}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
            />

            <button
              type="button"
              onClick={handleAddHoliday}
              className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              + Add Holiday
            </button>
          </div>

          {/* HOLIDAY LIST */}

          <div className="mt-5">

            {holidays.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">
                  No holidays added yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.date}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {holiday.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {holiday.date}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteHoliday(
                          holiday.date
                        )
                      }
                      className="w-fit rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Holidays are saved together with the attendance
            rules when you click the save button below.
          </p>
        </div>

        {/* ======================================
            CURRENT RULE SUMMARY
        ======================================= */}

        <div className="mt-7">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            Current Policy
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Check-In
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {form.checkInTime}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Late Threshold
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {form.lateAfterMinutes} min
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Minimum Hours
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {form.minimumWorkingHours} hrs
              </p>
            </div>
          </div>
        </div>

        {/* ======================================
            ACTIONS
        ======================================= */}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving Settings..."
              : "Save Attendance Settings"}
          </button>

        </div>
      </form>
    </div>
  );
}

export default AttendanceRules;