import * as faceapi from 'face-api.js';

export async function loadModels() {
  await faceapi.nets.tinyFaceDetector.load('/models/');
  await faceapi.nets.faceLandmark68Net.load('/models/');
  await faceapi.nets.faceRecognitionNet.load('/models/');
}

export { faceapi };
