import * as faceapi from 'face-api.js';

export async function loadModels() {
  const MODEL_URL = '/models';
  try {
    await Promise.all([
      // faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Model files missing
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
  } catch (error) {
    console.error("Error loading models:", error);
    throw error; // Re-throw to handle in UI
  }
}

export { faceapi };
