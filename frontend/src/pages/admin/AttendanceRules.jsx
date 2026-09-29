import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function AttendanceRules() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    checkInTime: "09:00",
    lateAfterMinutes: 15,
    minimumWorkingHours: 8,
    allowEarlyCheckout: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // GET SCHOOL ATTENDANCE RULES
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
    } catch (error) {
      console.error(
        "Get Attendance Rules Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load attendance rules."
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
  // SAVE RULES
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
       * IMPORTANT:
       * Existing SchoolLocation page already
       * uses PUT /school.
       *
       * We first fetch the existing school so
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
          }),
        }
      );

      const updatedRules =
        data.school.attendanceRules;

      setForm({
        checkInTime:
          updatedRules.checkInTime,

        lateAfterMinutes:
          updatedRules.lateAfterMinutes,

        minimumWorkingHours:
          updatedRules.minimumWorkingHours,

        allowEarlyCheckout:
          updatedRules.allowEarlyCheckout,
      });

      setSuccess(
        "Attendance rules updated successfully ✅"
      );
    } catch (error) {
      console.error(
        "Update Attendance Rules Error:",
        error
      );

      setError(
        error.message ||
          "Failed to update attendance rules."
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
          Loading attendance rules...
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
            Configure check-in, late marking and
            working-hour policies.
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

      {/* RULES CARD */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 lg:p-8"
      >
        {/* SECTION HEADER */}

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

        {/* CURRENT RULE SUMMARY */}

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

        {/* ACTIONS */}

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
              ? "Saving Rules..."
              : "Save Attendance Rules"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AttendanceRules;