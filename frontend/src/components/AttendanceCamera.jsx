import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api";
import {
  getFaceDescriptor,
  loadFaceModels,
} from "../services/faceService";

function AttendanceCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [attendance, setAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processing, setProcessing] = useState(false);

  // -----------------------------------
  // GET TODAY'S ATTENDANCE
  // -----------------------------------
  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      setError("");

      const data = await apiRequest(
        "/attendance/my/today"
      );

      setAttendance(data?.attendance || null);
    } catch (error) {
      console.error(
        "Fetch Today Attendance Error:",
        error
      );

      setError(
        error.message ||
          "Unable to load today's attendance."
      );
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [fetchTodayAttendance]);

  // -----------------------------------
  // START CAMERA
  // -----------------------------------
  const startCamera = async () => {
    try {
      setError("");
      setSuccess("");
      setStatus("Starting camera...");

      await loadFaceModels();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 640,
            height: 480,
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStarted(true);
      setStatus("Camera started. Position your face clearly.");
    } catch (error) {
      console.error("Camera Error:", error);

      setError(
        "Unable to access camera. Please allow camera permission."
      );

      setStatus("");
    }
  };

  // -----------------------------------
  // DETECT FACE
  // -----------------------------------
  const detectFace = async () => {
    try {
      setError("");
      setSuccess("");
      setStatus("Detecting face...");

      if (!videoRef.current) {
        setError("Camera is not available.");
        return;
      }

      const descriptor = await getFaceDescriptor(
        videoRef.current
      );

      if (!descriptor) {
        setFaceDetected(false);
        setFaceDescriptor(null);

        setError(
          "No clear face detected. Please look directly at the camera."
        );

        setStatus("");
        return;
      }

      if (descriptor.length !== 128) {
        setFaceDetected(false);
        setFaceDescriptor(null);

        setError("Invalid face data detected.");
        setStatus("");
        return;
      }

      setFaceDetected(true);
      setFaceDescriptor(descriptor);

      setStatus("Face detected successfully.");
    } catch (error) {
      console.error("Face Detection Error:", error);

      setError(
        "Unable to detect face. Please try again."
      );

      setStatus("");
    }
  };

  // -----------------------------------
  // GET GPS LOCATION
  // -----------------------------------
  const getLocation = () => {
    setError("");
    setSuccess("");
    setLocationStatus("Getting your location...");

    if (!navigator.geolocation) {
      setLocationStatus("");
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
        } = position.coords;

        setLocation({
          latitude,
          longitude,
          accuracy,
        });

        setLocationStatus(
          `Location detected • Accuracy ±${Math.round(
            accuracy
          )}m`
        );
      },
      (error) => {
        console.error("Location Error:", error);

        setLocation(null);
        setLocationStatus("");

        let message =
          "Unable to get your location.";

        if (error.code === 1) {
          message =
            "Location permission denied. Please allow location access.";
        }

        if (error.code === 2) {
          message =
            "Location unavailable. Please check your GPS/network.";
        }

        if (error.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }

        setError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // -----------------------------------
  // CHECK IN
  // -----------------------------------
  const handleCheckIn = async () => {
    if (!faceDescriptor) {
      setError(
        "Please detect your face before checking in."
      );
      return;
    }

    if (!location) {
      setError(
        "Please get your location before checking in."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      setStatus("Verifying face and location...");

      const data = await apiRequest(
        "/attendance/check-in",
        {
          method: "POST",
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            faceDescriptor,
          }),
        }
      );

      setAttendance(data.attendance || null);

      setSuccess(
        data.message ||
          "Check-in successful."
      );

      setStatus("Attendance marked successfully.");

      setFaceDescriptor(null);
      setFaceDetected(false);
    } catch (error) {
      console.error("Check-In Error:", error);

      setError(
        error.message ||
          "Unable to mark attendance."
      );

      setStatus("");
    } finally {
      setProcessing(false);
    }
  };

  // -----------------------------------
  // CHECK OUT
  // -----------------------------------
  const handleCheckOut = async () => {
    if (!location) {
      setError(
        "Please get your location before checking out."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      setStatus("Verifying your location...");

      const data = await apiRequest(
        "/attendance/check-out",
        {
          method: "POST",
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }),
        }
      );

      setAttendance(data.attendance || null);

      setSuccess(
        data.message ||
          "Check-out successful."
      );

      setStatus("Check-out completed successfully.");
    } catch (error) {
      console.error("Check-Out Error:", error);

      setError(
        error.message ||
          "Unable to complete check-out."
      );

      setStatus("");
    } finally {
      setProcessing(false);
    }
  };

  // -----------------------------------
  // WORKING DURATION
  // -----------------------------------
  const getWorkingDuration = () => {
    if (!attendance?.checkIn) {
      return "—";
    }

    const start = new Date(
      attendance.checkIn
    );

    const end = attendance.checkOut
      ? new Date(attendance.checkOut)
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

    const minutes =
      totalMinutes % 60;

    return `${hours}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
  };

  const formatTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // -----------------------------------
  // ATTENDANCE STATE
  // -----------------------------------
  const isCheckedIn =
    !!attendance?.checkIn &&
    !attendance?.checkOut;

  const isCompleted =
    !!attendance?.checkIn &&
    !!attendance?.checkOut;

  if (loadingAttendance) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* -------------------------------- */}
      {/* TODAY STATUS */}
      {/* -------------------------------- */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Today's Attendance
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              {isCompleted
                ? "Day Completed"
                : isCheckedIn
                ? "Currently Checked In"
                : "Not Checked In"}
            </h2>
          </div>

          <div
            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
              isCompleted
                ? "bg-blue-500/10 text-blue-400"
                : isCheckedIn
                ? "bg-green-500/10 text-green-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {isCompleted
              ? "COMPLETED"
              : isCheckedIn
              ? "CHECKED IN"
              : "PENDING"}
          </div>
        </div>

        {attendance && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-950/70 p-4">
              <p className="text-xs text-slate-500">
                Check-In
              </p>

              <p className="mt-1 text-lg font-semibold text-white">
                {formatTime(
                  attendance.checkIn
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-4">
              <p className="text-xs text-slate-500">
                Check-Out
              </p>

              <p className="mt-1 text-lg font-semibold text-white">
                {formatTime(
                  attendance.checkOut
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-4">
              <p className="text-xs text-slate-500">
                Working Time
              </p>

              <p className="mt-1 text-lg font-semibold text-white">
                {getWorkingDuration()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------- */}
      {/* COMPLETED */}
      {/* -------------------------------- */}

      {isCompleted && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400">
              ✓
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Attendance completed
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Your check-in and check-out for
                today have been recorded successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------- */}
      {/* CHECK-IN CAMERA */}
      {/* -------------------------------- */}

      {!isCheckedIn &&
        !isCompleted && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white">
                Check-In
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Verify your face and location to
                mark attendance.
              </p>
            </div>

            {/* CAMERA */}

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full object-cover"
              />
            </div>

            {/* CAMERA BUTTON */}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraStarted}
                className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cameraStarted
                  ? "Camera Started"
                  : "Start Camera"}
              </button>

              <button
                type="button"
                onClick={detectFace}
                disabled={!cameraStarted}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {faceDetected
                  ? "Face Detected ✓"
                  : "Detect Face"}
              </button>
            </div>

            {/* GPS */}

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Location Verification
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {locationStatus ||
                      "Location not detected"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={getLocation}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Get Location
                </button>
              </div>
            </div>

            {/* STATUS */}

            {status && (
              <div className="mt-4 rounded-xl bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                {status}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {success}
              </div>
            )}

            {/* CHECK IN */}

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={
                !faceDescriptor ||
                !location ||
                processing
              }
              className="mt-5 w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Verifying..."
                : "Mark Check-In"}
            </button>
          </div>
        )}

      {/* -------------------------------- */}
      {/* CHECK-OUT */}
      {/* -------------------------------- */}

      {isCheckedIn && (
        <div className="rounded-2xl border border-orange-500/20 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-white">
              Check-Out
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Face verification is not required for
              check-out. Only your current location
              will be verified.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                📍
              </div>

              <div>
                <p className="font-semibold text-white">
                  Location Required
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  You must be inside the school
                  location to check out.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={getLocation}
              className="mt-5 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {location
                ? "Refresh Location"
                : "Get Current Location"}
            </button>

            {locationStatus && (
              <p className="mt-3 text-center text-xs text-slate-400">
                {locationStatus}
              </p>
            )}
          </div>

          {status && (
            <div className="mt-4 rounded-xl bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
              {status}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={!location || processing}
            className="mt-5 w-full rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing
              ? "Checking Out..."
              : "Check Out"}
          </button>
        </div>
      )}
    </div>
  );
}

export default AttendanceCamera;