import { useState } from "react";
import { subscribeToPush } from "../../services/pushNotification";
import { apiRequest } from "../../services/api";

function AdminSettings() {
  const [notificationStatus, setNotificationStatus] = useState("idle");
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  const handleEnableNotifications = async () => {
    try {
      setNotificationStatus("loading");
      setMessage("");

      await subscribeToPush();

      setNotificationStatus("enabled");
      setMessage("Push notifications enabled successfully! 🔔");
    } catch (error) {
      console.error("Notification Error:", error);

      setNotificationStatus("error");
      setMessage(
        error?.message ||
          "Unable to enable notifications. Please allow browser permission."
      );
    }
  };

  const handleTestNotification = async () => {
    try {
      setTesting(true);
      setMessage("");

      await apiRequest("/push/test", {
        method: "POST",
      });

      setMessage("Test notification sent successfully! 🔔");
    } catch (error) {
      console.error("Test Notification Error:", error);

      setMessage(
        error?.message ||
          "Failed to send test notification."
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Manage your school attendance system settings.
        </p>
      </div>

      {/* NOTIFICATION SETTINGS */}
      <div className="max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">

        <div className="flex items-start gap-4">

          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
            🔔
          </div>

          <div className="flex-1">

            <h2 className="text-lg font-semibold text-white">
              Push Notifications
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Receive real-time notifications when employees check in,
              check out, or mark late attendance.
            </p>

          </div>

        </div>

        {/* STATUS */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-sm font-medium text-white">
                Notification Status
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {notificationStatus === "enabled"
                  ? "Notifications are enabled on this device."
                  : "Notifications are not enabled yet."}
              </p>
            </div>

            {notificationStatus === "enabled" ? (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Enabled
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                Not Enabled
              </span>
            )}

          </div>

        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-wrap gap-3">

          {notificationStatus !== "enabled" && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={notificationStatus === "loading"}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notificationStatus === "loading"
                ? "Enabling..."
                : "🔔 Enable Notifications"}
            </button>
          )}

          {notificationStatus === "enabled" && (
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testing}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testing
                ? "Sending..."
                : "🧪 Test Notification"}
            </button>
          )}

        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-300">
              {message}
            </p>
          </div>
        )}

      </div>

    </div>
  );
}

export default AdminSettings;