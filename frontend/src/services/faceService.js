import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) {
    return;
  }

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  modelsLoaded = true;

  console.log("Face models loaded successfully");
};

export const getFaceDescriptor = async (input) => {
  const detection = await faceapi
    .detectSingleFace(
      input,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  return Array.from(detection.descriptor);
};