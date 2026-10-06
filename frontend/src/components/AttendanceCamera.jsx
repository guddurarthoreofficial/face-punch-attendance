import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

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

  // Camera / Face
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  // Liveness
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [livenessRunning, setLivenessRunning] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState(
    "Liveness check required"
  );

  // Location
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");

  // UI
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState(false);

  // ==========================================
  // GET TODAY'S ATTENDANCE
  // ==========================================

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

  // ==========================================
  // INITIAL LOAD + CLEANUP
  // ==========================================

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

  // ==========================================
  // START CAMERA
  // ==========================================

  const startCamera = async () => {
    try {
      setError("");
      setSuccess("");
      setFaceDescriptor(null);
      setFaceDetected(false);
      setLivenessPassed(false);
      setLivenessStatus("Liveness check required");
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

      setStatus(
        "Camera started. Position your face clearly."
      );
    } catch (error) {
      console.error(
        "Camera Error:",
        error
      );

      setError(
        "Unable to access camera. Please allow camera permission."
      );

      setStatus("");
    }
  };

  // ==========================================
  // LIVENESS HELPERS
  // ==========================================

  const calculateEyeAspectRatio = (eye) => {
    if (!eye || eye.length < 6) {
      return 1;
    }

    const vertical1 = Math.hypot(
      eye[1].x - eye[5].x,
      eye[1].y - eye[5].y
    );

    const vertical2 = Math.hypot(
      eye[2].x - eye[4].x,
      eye[2].y - eye[4].y
    );

    const horizontal = Math.hypot(
      eye[0].x - eye[3].x,
      eye[0].y - eye[3].y
    );

    if (horizontal === 0) {
      return 1;
    }

    return (
      (vertical1 + vertical2) /
      (2 * horizontal)
    );
  };

  const getEyeCenters = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const getCenter = (points) => {
      if (!points || points.length === 0) {
        return {
          x: 0,
          y: 0,
        };
      }

      const x =
        points.reduce(
          (sum, point) => sum + point.x,
          0
        ) / points.length;

      const y =
        points.reduce(
          (sum, point) => sum + point.y,
          0
        ) / points.length;

      return { x, y };
    };

    return {
      left: getCenter(leftEye),
      right: getCenter(rightEye),
    };
  };

  // ==========================================
  // LIVENESS CHECK
  // ==========================================

  const runLivenessCheck = async () => {
    if (!videoRef.current) {
      setError(
        "Please start the camera first."
      );
      return;
    }

    if (!cameraStarted) {
      setError(
        "Please start the camera first."
      );
      return;
    }

    if (livenessRunning) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      // Remove old descriptor before a new liveness attempt
      setFaceDescriptor(null);
      setFaceDetected(false);

      setLivenessRunning(true);
      setLivenessPassed(false);

      setLivenessStatus(
        "Blink once and move your head slightly left or right 👁️↔️"
      );

      setStatus(
        "Checking that you are a real person..."
      );

      let blinkDetected = false;
      let blinkClosed = false;
      let headMoved = false;

      let baselineNoseRatio = null;

      const startTime = Date.now();
      const timeout = 8000;

      while (
        Date.now() - startTime <
        timeout
      ) {
        const detection =
          await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions(
                {
                  inputSize: 320,
                  scoreThreshold: 0.5,
                }
              )
            )
            .withFaceLandmarks();

        if (!detection) {
          setFaceDetected(false);

          setLivenessStatus(
            "Face not detected ❌"
          );

          await new Promise(
            (resolve) =>
              setTimeout(resolve, 150)
          );

          continue;
        }

        setFaceDetected(true);

        const landmarks =
          detection.landmarks;

        // ======================================
        // BLINK DETECTION
        // ======================================

        const leftEye =
          landmarks.getLeftEye();

        const rightEye =
          landmarks.getRightEye();

        const leftEAR =
          calculateEyeAspectRatio(
            leftEye
          );

        const rightEAR =
          calculateEyeAspectRatio(
            rightEye
          );

        const averageEAR =
          (leftEAR + rightEAR) / 2;

        // Eyes closed
        if (averageEAR < 0.22) {
          blinkClosed = true;
        }

        // Eyes opened after closing
        if (
          blinkClosed &&
          averageEAR > 0.25
        ) {
          blinkDetected = true;
          blinkClosed = false;

          setLivenessStatus(
            "Blink detected ✅ Now move your head slightly ↔️"
          );
        }

        // ======================================
        // HEAD MOVEMENT DETECTION
        // ======================================

        const eyes =
          getEyeCenters(landmarks);

        const eyeCenterX =
          (eyes.left.x +
            eyes.right.x) /
          2;

        const eyeDistance =
          Math.abs(
            eyes.right.x -
              eyes.left.x
          );

        const nose =
          landmarks.getNose();

        if (
          nose &&
          nose.length > 0 &&
          eyeDistance > 0
        ) {
          const noseTip =
            nose[3] ||
            nose[
              Math.floor(
                nose.length / 2
              )
            ];

          const noseRatio =
            (noseTip.x -
              eyeCenterX) /
            eyeDistance;

          if (
            baselineNoseRatio ===
            null
          ) {
            baselineNoseRatio =
              noseRatio;
          }

          const movement =
            Math.abs(
              noseRatio -
                baselineNoseRatio
            );

          if (movement > 0.12) {
            headMoved = true;
          }
        }

        // ======================================
        // STATUS
        // ======================================

        if (
          blinkDetected &&
          !headMoved
        ) {
          setLivenessStatus(
            "Blink passed ✅ Move your head a little more ↔️"
          );
        }

        if (
          !blinkDetected &&
          headMoved
        ) {
          setLivenessStatus(
            "Head movement passed ✅ Now blink once 👁️"
          );
        }

        // ======================================
        // BOTH PASSED
        // ======================================

        if (
          blinkDetected &&
          headMoved
        ) {
          setLivenessStatus(
            "Liveness actions completed ✅ Capturing face..."
          );

          // Capture fresh face descriptor
          // AFTER liveness verification
          const liveDescriptor =
            await getFaceDescriptor(
              videoRef.current
            );

          if (
            !liveDescriptor ||
            liveDescriptor.length !== 128
          ) {
            setLivenessPassed(false);
            setFaceDescriptor(null);

            setLivenessStatus(
              "Liveness passed, but face capture failed ❌"
            );

            setStatus(
              "Please keep your face clearly visible and try again."
            );

            setLivenessRunning(false);

            return;
          }

          // Convert Float32Array to normal Array
          const descriptorArray =
            Array.from(
              liveDescriptor
            );

          setFaceDescriptor(
            descriptorArray
          );

          setFaceDetected(true);

          setLivenessPassed(true);

          setLivenessStatus(
            "Liveness verified successfully ✅"
          );

          setStatus(
            "Real person verified and face captured ✅ You can now get location and check in."
          );

          setLivenessRunning(false);

          return;
        }

        await new Promise(
          (resolve) =>
            setTimeout(resolve, 150)
        );
      }

      // ======================================
      // TIMEOUT
      // ======================================

      setLivenessPassed(false);
      setFaceDescriptor(null);

      setLivenessStatus(
        "Liveness check failed ❌ Please try again."
      );

      setStatus(
        "Please blink and move your head naturally, then try again."
      );
    } catch (error) {
      console.error(
        "Liveness Check Error:",
        error
      );

      setLivenessPassed(false);
      setFaceDescriptor(null);

      setLivenessStatus(
        "Liveness check failed ❌"
      );

      setStatus(
        "Liveness verification failed ❌"
      );
    } finally {
      setLivenessRunning(false);
    }
  };

  // ==========================================
  // GET GPS LOCATION
  // ==========================================

  const getLocation = () => {
    setError("");
    setSuccess("");
    setLocationStatus(
      "Getting your location..."
    );

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
        console.error(
          "Location Error:",
          error
        );

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

  // ==========================================
  // CHECK IN
  // ==========================================

  const handleCheckIn = async () => {
    // Liveness
    if (!livenessPassed) {
      setError(
        "Please complete liveness verification first."
      );
      return;
    }

    // Face
    if (
      !faceDescriptor ||
      faceDescriptor.length !== 128
    ) {
      setError(
        "Face verification data is not available. Please complete liveness again."
      );
      return;
    }

    // GPS
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

      setStatus(
        "Verifying face and location..."
      );

      const data =
        await apiRequest(
          "/attendance/check-in",
          {
            method: "POST",
            body: JSON.stringify({
              latitude:
                location.latitude,
              longitude:
                location.longitude,
              accuracy:
                location.accuracy,
              faceDescriptor,
            }),
          }
        );

      setAttendance(
        data.attendance || null
      );

      setSuccess(
        data.message ||
          "Check-in successful."
      );

      setStatus(
        "Attendance marked successfully."
      );

      // Clear security state
      setFaceDescriptor(null);
      setFaceDetected(false);
      setLivenessPassed(false);

      setLivenessStatus(
        "Liveness check completed for today"
      );

      // Refresh today's attendance
      await fetchTodayAttendance();
    } catch (error) {
      console.error(
        "Check-In Error:",
        error
      );

      setError(
        error.message ||
          "Unable to mark attendance."
      );

      setStatus("");
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // CHECK OUT
  // ==========================================

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

      setStatus(
        "Verifying your location..."
      );

      const data =
        await apiRequest(
          "/attendance/check-out",
          {
            method: "POST",
            body: JSON.stringify({
              latitude:
                location.latitude,
              longitude:
                location.longitude,
              accuracy:
                location.accuracy,
            }),
          }
        );

      setAttendance(
        data.attendance || null
      );

      setSuccess(
        data.message ||
          "Check-out successful."
      );

      setStatus(
        "Check-out completed successfully."
      );

      await fetchTodayAttendance();
    } catch (error) {
      console.error(
        "Check-Out Error:",
        error
      );

      setError(
        error.message ||
          "Unable to complete check-out."
      );

      setStatus("");
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // WORKING DURATION
  // ==========================================

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
      end.getTime() -
      start.getTime();

    if (difference < 0) {
      return "—";
    }

    const totalMinutes =
      Math.floor(
        difference /
          (1000 * 60)
      );

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    return `${hours}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // ==========================================
  // ATTENDANCE STATE
  // ==========================================

  const isCheckedIn =
    !!attendance?.checkIn &&
    !attendance?.checkOut;

  const isCompleted =
    !!attendance?.checkIn &&
    !!attendance?.checkOut;

  // ==========================================
  // LOADING
  // ==========================================

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

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-6">

      {/* ======================================
          TODAY STATUS
      ====================================== */}

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

      {/* ======================================
          COMPLETED
      ====================================== */}

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

      {/* ======================================
          CHECK-IN
      ====================================== */}

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

            {/* START CAMERA */}

            <div className="mt-4">
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraStarted}
                className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cameraStarted
                  ? "Camera Started"
                  : "Start Camera"}
              </button>
            </div>

            {/* LIVENESS */}

            <div className="mt-5">
              <button
                type="button"
                onClick={runLivenessCheck}
                disabled={
                  !cameraStarted ||
                  livenessRunning
                }
                className={`w-full rounded-xl px-6 py-3 font-semibold text-white ${
                  !cameraStarted ||
                  livenessRunning
                    ? "cursor-not-allowed bg-slate-600"
                    : livenessPassed
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {livenessRunning
                  ? "Checking Liveness..."
                  : livenessPassed
                    ? "Liveness Passed ✅"
                    : "Verify Liveness"}
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-300">
                  {livenessStatus}
                </p>
              </div>
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

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {success}
              </div>
            )}

            {/* CHECK-IN */}

            {!livenessPassed && (
              <p className="mt-4 text-center text-xs text-amber-300">
                Complete liveness verification before
                marking check-in.
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={
                !livenessPassed ||
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

      {/* ======================================
          CHECK-OUT
      ====================================== */}

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
            disabled={
              !location ||
              processing
            }
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