import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import {
  loadFaceModels,
  getFaceDescriptor,
} from "../services/faceService";

const API_URL = "http://localhost:5000/api";

function FaceCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("Loading face models...");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [registering, setRegistering] = useState(false);

  // ==========================================
  // LOAD FACE MODELS
  // ==========================================
  useEffect(() => {
    const setup = async () => {
      try {
        await loadFaceModels();
        setStatus("Face models ready ✅");
      } catch (error) {
        console.error(error);
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
      }

      setCameraStarted(true);
      setStatus("Camera started 📷");
    } catch (error) {
      console.error("Camera Error:", error);
      setStatus("Camera permission denied ❌");
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
        setStatus("No face detected ❌");
        return;
      }

      setFaceDetected(true);

      setStatus("Face detected successfully ✅");

      console.log(
        "Face Descriptor:",
        Array.from(detection.descriptor)
      );

      console.log(
        "Descriptor Length:",
        detection.descriptor.length
      );
    } catch (error) {
      console.error("Face Detection Error:", error);
      setStatus("Face detection failed ❌");
    }
  };

  // ==========================================
  // CAPTURE FACE
  // ==========================================
  const captureFace = async () => {
    if (!videoRef.current) return;

    try {
      setStatus("Capturing face...");

      const descriptor = await getFaceDescriptor(
        videoRef.current
      );

      if (!descriptor) {
        setFaceDetected(false);
        setFaceDescriptor(null);
        setStatus("Please show your face clearly ❌");
        return;
      }

      if (descriptor.length !== 128) {
        setFaceDescriptor(null);
        setStatus("Invalid face descriptor ❌");
        return;
      }

      setFaceDetected(true);
      setFaceDescriptor(descriptor);

      console.log(
        "Captured Face Descriptor:",
        descriptor
      );

      console.log(
        "Descriptor Length:",
        descriptor.length
      );

      setStatus(
        "Face captured successfully ✅ Ready to register"
      );
    } catch (error) {
      console.error("Capture Face Error:", error);
      setStatus("Face capture failed ❌");
    }
  };

  // ==========================================
  // REGISTER FACE IN BACKEND
  // ==========================================
  const registerFace = async () => {
    if (!employeeId.trim()) {
      setStatus("Please enter Employee ID ❌");
      return;
    }

    if (!faceDescriptor) {
      setStatus("Please capture face first ❌");
      return;
    }

    if (faceDescriptor.length !== 128) {
      setStatus("Invalid face descriptor ❌");
      return;
    }

    try {
      setRegistering(true);
      setStatus("Registering face...");

      const token = localStorage.getItem("token");

      if (!token) {
        setStatus("Admin login token not found ❌");
        return;
      }

      const response = await fetch(
        `${API_URL}/employees/${employeeId.trim()}/face`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            faceData: faceDescriptor,
          }),
        }
      );

      const data = await response.json();

      console.log("Register Face Response:", data);

      if (!response.ok) {
        setStatus(
          data.message || "Face registration failed ❌"
        );
        return;
      }

      setStatus(
        "Employee face registered successfully ✅"
      );

      setFaceDescriptor(null);
    } catch (error) {
      console.error("Register Face Error:", error);

      setStatus(
        "Unable to connect to backend ❌"
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

        <h1 className="text-3xl font-bold text-center mb-6">
          Employee Face Registration
        </h1>

        <div className="bg-slate-900 rounded-2xl p-5">

          {/* EMPLOYEE ID */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Employee ID
            </label>

            <input
              type="text"
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value)
              }
              placeholder="Enter Employee ID"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
            />

            <p className="text-xs text-slate-400 mt-2">
              Example: 6ab3fae6570ccfc5c22bb099
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

                <button
                  onClick={registerFace}
                  disabled={
                    !faceDescriptor || registering
                  }
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    !faceDescriptor || registering
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {registering
                    ? "Registering..."
                    : "Register Face"}
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