import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

import {
  loadFaceModels,
  getFaceDescriptor,
} from "../services/faceService";

import { apiRequest } from "../services/api";

function AttendanceCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState(
    "Loading face models..."
  );

  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(
    "Location not checked"
  );

  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LOAD FACE MODELS
  // ==========================================

  useEffect(() => {
    const setup = async () => {
      try {
        await loadFaceModels();

        setStatus("Face models ready ✅");
      } catch (error) {
        console.error(
          "Face Model Error:",
          error
        );

        setStatus(
          "Failed to load face models ❌"
        );
      }
    };

    setup();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // ==========================================
  // START CAMERA
  // ==========================================

  const startCamera = async () => {
    try {
      setError("");
      setSuccess("");

      setStatus("Starting camera...");

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
      }

      setCameraStarted(true);

      setStatus("Camera started 📷");

    } catch (error) {
      console.error(
        "Camera Error:",
        error
      );

      setError(
        "Camera permission denied or camera unavailable."
      );

      setStatus(
        "Camera could not be started ❌"
      );
    }
  };

  // ==========================================
  // GET GPS LOCATION
  // ==========================================

  const getLocation = () => {
    setLocationStatus(
      "Getting your location..."
    );

    setError("");

    if (!navigator.geolocation) {
      setLocationStatus(
        "GPS is not supported ❌"
      );

      setError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        setLocation({
          latitude,
          longitude,
          accuracy,
        });

        setLocationStatus(
          `Location detected ✅ Accuracy: ${Math.round(
            accuracy
          )}m`
        );
      },

      (error) => {
        console.error(
          "GPS Error:",
          error
        );

        setLocation(null);

        setLocationStatus(
          "Unable to get location ❌"
        );

        setError(
          "Please allow location permission."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // ==========================================
  // DETECT FACE
  // ==========================================

  const detectFace = async () => {
    if (!videoRef.current) {
      return;
    }

    try {
      setError("");
      setStatus("Detecting face...");

      const detection =
        await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!detection) {
        setFaceDetected(false);
        setFaceDescriptor(null);

        setStatus(
          "No face detected ❌"
        );

        return;
      }

      setFaceDetected(true);

      setStatus(
        "Face detected successfully ✅"
      );

      console.log(
        "Live Face Descriptor:",
        Array.from(
          detection.descriptor
        )
      );

      console.log(
        "Descriptor Length:",
        detection.descriptor.length
      );

    } catch (error) {
      console.error(
        "Face Detection Error:",
        error
      );

      setFaceDetected(false);

      setStatus(
        "Face detection failed ❌"
      );
    }
  };

  // ==========================================
  // CAPTURE FACE
  // ==========================================

  const captureFace = async () => {
    if (!videoRef.current) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      setStatus(
        "Capturing face..."
      );

      const descriptor =
        await getFaceDescriptor(
          videoRef.current
        );

      if (!descriptor) {
        setFaceDetected(false);
        setFaceDescriptor(null);

        setStatus(
          "Please show your face clearly ❌"
        );

        return;
      }

      if (descriptor.length !== 128) {
        setFaceDescriptor(null);

        setStatus(
          "Invalid face descriptor ❌"
        );

        return;
      }

      setFaceDetected(true);
      setFaceDescriptor(descriptor);

      console.log(
        "Captured Attendance Descriptor:",
        descriptor
      );

      console.log(
        "Descriptor Length:",
        descriptor.length
      );

      setStatus(
        "Face captured successfully ✅"
      );

    } catch (error) {
      console.error(
        "Capture Face Error:",
        error
      );

      setStatus(
        "Face capture failed ❌"
      );
    }
  };

  // ==========================================
  // MARK ATTENDANCE
  // ==========================================

  const markAttendance = async () => {
    setError("");
    setSuccess("");

    // Face check
    if (!faceDescriptor) {
      setError(
        "Please capture your face first."
      );

      return;
    }

    if (faceDescriptor.length !== 128) {
      setError(
        "Invalid face data."
      );

      return;
    }

    // GPS check
    if (!location) {
      setError(
        "Please get your current location first."
      );

      return;
    }

    try {
      setCheckingIn(true);

      setStatus(
        "Verifying face and location..."
      );

      const data = await apiRequest(
        "/attendance/check-in",
        {
          method: "POST",

          body: JSON.stringify({
            latitude:
              location.latitude,

            longitude:
              location.longitude,

            faceDescriptor,
          }),
        }
      );

      console.log(
        "Check-in Response:",
        data
      );

      setSuccess(
        "Attendance marked successfully ✅"
      );

      setStatus(
        "Attendance marked successfully ✅"
      );

    } catch (error) {
      console.error(
        "Attendance Error:",
        error
      );

      setError(
        error.message ||
          "Attendance could not be marked."
      );

      setStatus(
        "Attendance verification failed ❌"
      );

    } finally {
      setCheckingIn(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="w-full max-w-2xl mx-auto">

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

        {/* CAMERA */}

        <div className="relative bg-black rounded-xl overflow-hidden">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
          />

          {!cameraStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p className="text-slate-300">
                Camera is not started
              </p>
            </div>
          )}

          {faceDetected && (
            <div className="absolute top-4 left-4 bg-green-600 px-4 py-2 rounded-lg font-semibold">
              Face Detected ✅
            </div>
          )}
        </div>

        {/* STATUS */}

        <div className="mt-5 text-center">

          <p className="text-lg text-slate-300">
            {status}
          </p>

        </div>

        {/* LOCATION STATUS */}

        <div className="mt-4 bg-slate-800 rounded-xl p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                GPS Location
              </p>

              <p className="text-sm text-white mt-1">
                {locationStatus}
              </p>

            </div>

            {location && (
              <span className="text-green-400 text-xl">
                📍
              </span>
            )}

          </div>

          {location && (
            <div className="mt-3 text-xs text-slate-400">

              <p>
                Latitude:{" "}
                {location.latitude}
              </p>

              <p>
                Longitude:{" "}
                {location.longitude}
              </p>

              <p>
                Accuracy:{" "}
                {Math.round(
                  location.accuracy
                )}
                m
              </p>

            </div>
          )}

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-4 bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-4 bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* BUTTONS */}

        <div className="flex flex-wrap gap-3 justify-center mt-6">

          {!cameraStarted && (
            <button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Start Camera
            </button>
          )}

          {cameraStarted && (
            <>
              <button
                onClick={detectFace}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
              >
                Detect Face
              </button>

              <button
                onClick={captureFace}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold"
              >
                Capture Face
              </button>
            </>
          )}

          <button
            onClick={getLocation}
            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg font-semibold"
          >
            Get Location
          </button>

        </div>

        {/* ATTENDANCE BUTTON */}

        <div className="mt-6">

          <button
            onClick={markAttendance}
            disabled={
              !faceDescriptor ||
              !location ||
              checkingIn ||
              !!success
            }
            className={`w-full py-4 rounded-xl font-bold text-lg transition ${
              !faceDescriptor ||
              !location ||
              checkingIn ||
              !!success
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            }`}
          >
            {checkingIn
              ? "Verifying..."
              : success
              ? "Attendance Marked ✅"
              : "Mark Attendance"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default AttendanceCamera;