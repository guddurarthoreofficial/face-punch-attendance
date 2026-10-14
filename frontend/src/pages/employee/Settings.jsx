
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import {
  subscribeToPush,
  registerPushServiceWorker,
} from "../../services/pushNotification";

function Settings() {
  const [permission, setPermission] = useState(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const [subscriptionStatus, setSubscriptionStatus] = useState("unknown");
  const [enabling, setEnabling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshStatus = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    if (!("serviceWorker" in navigator)) {
      setSubscriptionStatus("unsupported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        setSubscriptionStatus("not-enabled");
        return;
      }

      const subscription = await registration.pushManager.getSubscription();

      setSubscriptionStatus(
        subscription ? "enabled" : "not-enabled"
      );
    } catch (err) {
      console.error("Notification status error:", err);
      setSubscriptionStatus("unknown");
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleEnableNotifications = async () => {
    setEnabling(true);
    setError("");
    setMessage("");

    try {
      if (!("Notification" in window)) {
        throw new Error(
          "This browser does not support push notifications."
        );
      }

      if (!("serviceWorker" in navigator)) {
        throw new Error(
          "Service workers are not supported in this browser."
        );
      }

      if (Notification.permission === "denied") {
        throw new Error(
          "Notifications are blocked in browser settings. Allow notifications for this website, then try again."
        );
      }

      await registerPushServiceWorker();
      await subscribeToPush();

      await refreshStatus();

      if (Notification.permission === "granted") {
        setMessage("Push notification setup completed.");
      } else {
        setMessage(
          "Please allow notifications in your browser to complete setup."
        );
      }
    } catch (err) {
      console.error("Enable notification error:", err);
      setError(err.message || "Could not enable notifications.");
      await refreshStatus();
    } finally {
      setEnabling(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setError("");
    setMessage("");

    try {
      if (!("Notification" in window)) {
        throw new Error(
          "This browser does not support notifications."
        );
      }

      if (Notification.permission !== "granted") {
        throw new Error(
          "Enable browser notifications first."
        );
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (!subscription) {
        throw new Error(
          "No push subscription found. Enable notifications first."
        );
      }

      const result = await apiRequest("/push/test", {
        method: "POST",
      });

      setMessage(
        result.message ||
          "Test notification request sent successfully."
      );

      await refreshStatus();
    } catch (err) {
      console.error("Test notification error:", err);
      setError(err.message || "Test notification failed.");
    } finally {
      setTesting(false);
    }
  };

  const permissionLabel = {
    granted: "Permission granted",
    denied: "Permission blocked",
    default: "Permission not requested",
    unsupported: "Not supported",
  };

  const subscriptionLabel = {
    enabled: "Push subscription active",
    "not-enabled": "Not subscribed",
    unsupported: "Service worker not supported",
    unknown: "Status unavailable",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          Employee Portal / Preferences
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Manage browser notifications and test push notifications.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl">
            🔔
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white">
              Push Notifications
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Receive school attendance and other important updates through
              browser push notifications. Your browser must allow notifications.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Browser Permission</p>

            <p
              className={`mt-2 text-sm font-semibold ${
                permission === "granted"
                  ? "text-emerald-400"
                  : permission === "denied"
                    ? "text-red-400"
                    : "text-amber-400"
              }`}
            >
              {permissionLabel[permission] || permission}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Subscription</p>

            <p
              className={`mt-2 text-sm font-semibold ${
                subscriptionStatus === "enabled"
                  ? "text-emerald-400"
                  : "text-slate-300"
              }`}
            >
              {subscriptionLabel[subscriptionStatus] ||
                subscriptionStatus}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={
              enabling ||
              permission === "unsupported" ||
              subscriptionStatus === "unsupported"
            }
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enabling
              ? "Setting up..."
              : subscriptionStatus === "enabled"
                ? "Refresh Notification Setup"
                : "Enable Push Notifications"}
          </button>

          <button
            type="button"
            onClick={handleTestNotification}
            disabled={
              testing ||
              enabling ||
              permission !== "granted" ||
              subscriptionStatus !== "enabled"
            }
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? "Sending Test..." : "🧪 Send Test Notification"}
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              refreshStatus();
            }}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Refresh Status
          </button>
        </div>

        {permission === "denied" && (
          <p className="mt-4 text-sm leading-6 text-amber-300">
            Notifications are blocked by the browser. Open your browser's
            site settings, allow notifications for this website, then refresh
            this page. This page cannot override a blocked browser permission.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-white">
          How to test
        </h2>

        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-400">
          <li>Click Enable Push Notifications and allow the browser prompt.</li>
          <li>Confirm the subscription status shows as active.</li>
          <li>Click Send Test Notification.</li>
          <li>Check whether the notification appears on your device.</li>
        </ol>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          The test button calls your existing POST /api/push/test endpoint.
          Actual delivery depends on your backend push service, saved
          subscription, browser permission and device settings.
        </p>
      </section>
    </div>
  );
}

export default Settings;

