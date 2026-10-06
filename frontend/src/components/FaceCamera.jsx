import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

import { apiRequest } from "../services/api";
import {
  loadFaceModels,
  getFaceDescriptor,
} from "../services/faceService";

function FaceCamera({ employeeId: employeeIdProp }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("Loading face models...");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Temporary descriptor
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  // Multiple registered face samples
  const [faceSamples, setFaceSamples] = useState([]);

  const [employeeId, setEmployeeId] = useState(
    employeeIdProp || ""
  );

  const [registering, setRegistering] = useState(false);

  const MAX_SAMPLES = 5;

  // ==========================================
  // LOAD FACE MODELS
  // ==========================================

  useEffect(() => {
    const setup = async () => {
      try {
        await loadFaceModels();
        setStatus("Face models ready ✅");
      } catch (error) {
        console.error("Face Model Error:", error);
        setStatus("Failed to load face models ❌");
      }
    };

    setup();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // ==========================================
  // UPDATE EMPLOYEE ID
  // ==========================================

  useEffect(() => {
    if (employeeIdProp) {
      setEmployeeId(employeeIdProp);
    }
  }, [employeeIdProp]);

  // ==========================================
  // START CAMERA
  // ==========================================

  const startCamera = async () => {
    try {
      setStatus("Starting camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
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
      setStatus("Camera started 📷");
    } catch (error) {
      console.error("Camera Error:", error);
      setStatus(
        "Camera permission denied ❌ Please allow camera access."
      );
    }
  };

  // ==========================================
  // DETECT FACE
  // ==========================================

  const detectFace = async () => {
    if (!videoRef.current) return;

    try {
      setStatus("Detecting face...");

      const detection = await faceapi
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

        setStatus("No face detected ❌");
        return;
      }

      if (!detection.descriptor) {
        setFaceDetected(false);
        setFaceDescriptor(null);

        setStatus("Face descriptor could not be generated ❌");
        return;
      }

      if (detection.descriptor.length !== 128) {
        setFaceDetected(false);
        setFaceDescriptor(null);

        setStatus("Invalid face descriptor ❌");
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      setFaceDetected(true);
      setFaceDescriptor(descriptor);

      console.log(
        "Face Descriptor:",
        descriptor
      );

      console.log(
        "Descriptor Length:",
        descriptor.length
      );

      setStatus("Face detected successfully ✅");
    } catch (error) {
      console.error("Face Detection Error:", error);

      setFaceDetected(false);
      setFaceDescriptor(null);

      setStatus("Face detection failed ❌");
    }
  };

  // ==========================================
  // CAPTURE FACE SAMPLE
  // ==========================================

  const captureFace = async () => {
    if (!videoRef.current) {
      setStatus("Camera is not available ❌");
      return;
    }

    if (faceSamples.length >= MAX_SAMPLES) {
      setStatus(
        "Maximum 5 face samples already captured ✅"
      );
      return;
    }

    try {
      setStatus(
        `Capturing face sample ${
          faceSamples.length + 1
        }/${MAX_SAMPLES}...`
      );

      // Capture a fresh descriptor
      const descriptor = await getFaceDescriptor(
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

      const sample = Array.from(descriptor);

      // Store latest descriptor temporarily
      setFaceDescriptor(sample);
      setFaceDetected(true);

      // Add sample
      setFaceSamples((previousSamples) => [
        ...previousSamples,
        sample,
      ]);

      console.log(
        `Face Sample ${
          faceSamples.length + 1
        }:`,
        sample
      );

      console.log(
        "Descriptor Length:",
        sample.length
      );

      const nextCount =
        faceSamples.length + 1;

      if (nextCount >= MAX_SAMPLES) {
        setStatus(
          "5 face samples captured successfully ✅ You can now register."
        );
      } else {
        setStatus(
          `Face sample ${nextCount}/${MAX_SAMPLES} captured ✅ Change your face angle slightly and capture again.`
        );
      }

      // Clear temporary descriptor
      setFaceDescriptor(null);
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
  // REMOVE LAST SAMPLE
  // ==========================================

  const removeLastSample = () => {
    if (faceSamples.length === 0) {
      return;
    }

    setFaceSamples((previousSamples) =>
      previousSamples.slice(0, -1)
    );

    setFaceDescriptor(null);

    setStatus(
      "Last face sample removed. You can capture again."
    );
  };

  // ==========================================
  // RESET ALL SAMPLES
  // ==========================================

  const resetSamples = () => {
    setFaceSamples([]);
    setFaceDescriptor(null);
    setFaceDetected(false);

    setStatus(
      "All face samples cleared. Capture again."
    );
  };

  // ==========================================
  // REGISTER FACE SAMPLES
  // ==========================================

  const registerFace = async () => {
    if (!employeeId.trim()) {
      setStatus(
        "Employee ID not found ❌"
      );
      return;
    }

    if (faceSamples.length === 0) {
      setStatus(
        "Please capture at least one face sample ❌"
      );
      return;
    }

    if (faceSamples.length > MAX_SAMPLES) {
      setStatus(
        "Maximum 5 face samples are allowed ❌"
      );
      return;
    }

    // Final validation
    const invalidSample =
      faceSamples.some(
        (sample) =>
          !Array.isArray(sample) ||
          sample.length !== 128 ||
          sample.some(
            (value) =>
              typeof value !== "number" ||
              !Number.isFinite(value)
          )
      );

    if (invalidSample) {
      setStatus(
        "One or more face samples are invalid ❌"
      );
      return;
    }

    try {
      setRegistering(true);

      setStatus(
        `Registering ${faceSamples.length} face samples...`
      );

      const data = await apiRequest(
        `/employees/${employeeId.trim()}/face`,
        {
          method: "POST",
          body: JSON.stringify({
            faceSamples,
          }),
        }
      );

      console.log(
        "Register Face Response:",
        data
      );

      setStatus(
        `Employee face registered successfully ✅ (${
          data.employee?.faceSampleCount ||
          faceSamples.length
        } samples)`
      );

      // Clear samples after successful registration
      setFaceSamples([]);
      setFaceDescriptor(null);
      setFaceDetected(false);
    } catch (error) {
      console.error(
        "Register Face Error:",
        error
      );

      setStatus(
        error.message ||
          "Face registration failed ❌"
      );
    } finally {
      setRegistering(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          Employee Face Registration
        </h1>

        <p className="text-center text-slate-400 mb-6">
          Capture multiple face angles for better recognition
        </p>

        <div className="bg-slate-900 rounded-2xl p-5">

          {/* SAMPLE PROGRESS */}

          <div className="mb-5 bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">
                Face Samples
              </span>

              <span className="text-blue-400 font-bold">
                {faceSamples.length}/{MAX_SAMPLES}
              </span>
            </div>

            <div className="flex gap-2">
              {Array.from({
                length: MAX_SAMPLES,
              }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full ${
                    index < faceSamples.length
                      ? "bg-green-500"
                      : "bg-slate-600"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Capture different angles: straight,
              left, right, slightly up and slightly down.
            </p>
          </div>

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
                <p className="text-slate-400">
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

          {/* BUTTONS */}

          <div className="flex flex-wrap gap-3 justify-center mt-6">

            {!cameraStarted && (
              <button
                type="button"
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
              >
                Start Camera
              </button>
            )}

            {cameraStarted && (
              <>
                {/* DETECT */}

                <button
                  type="button"
                  onClick={detectFace}
                  disabled={registering}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold disabled:bg-slate-600"
                >
                  Detect Face
                </button>

                {/* CAPTURE */}

                <button
                  type="button"
                  onClick={captureFace}
                  disabled={
                    faceSamples.length >= MAX_SAMPLES ||
                    registering
                  }
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    faceSamples.length >= MAX_SAMPLES ||
                    registering
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {faceSamples.length >= MAX_SAMPLES
                    ? "5 Samples Captured"
                    : `Capture Sample ${
                        faceSamples.length + 1
                      }`}
                </button>

                {/* REMOVE LAST */}

                {faceSamples.length > 0 && (
                  <button
                    type="button"
                    onClick={removeLastSample}
                    disabled={registering}
                    className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-semibold disabled:bg-slate-600"
                  >
                    Remove Last
                  </button>
                )}

                {/* RESET */}

                {faceSamples.length > 0 && (
                  <button
                    type="button"
                    onClick={resetSamples}
                    disabled={registering}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold disabled:bg-slate-600"
                  >
                    Reset Samples
                  </button>
                )}

                {/* REGISTER */}

                <button
                  type="button"
                  onClick={registerFace}
                  disabled={
                    faceSamples.length === 0 ||
                    registering
                  }
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    faceSamples.length === 0 ||
                    registering
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {registering
                    ? "Registering..."
                    : `Register ${
                        faceSamples.length
                      } Sample${
                        faceSamples.length === 1
                          ? ""
                          : "s"
                      }`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaceCamera;