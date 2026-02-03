// src/utils/descargar.js

// Cargar todos los modelos de face-api.js desde /public/models
export async function cargarModelos() {
  const ruta = "/models";

  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(ruta),
      faceapi.nets.faceLandmark68Net.loadFromUri(ruta),
      faceapi.nets.faceRecognitionNet.loadFromUri(ruta)
    ]);

    console.log("Modelos cargados correctamente ✔");
  } catch (error) {
    console.error("Error cargando modelos:", error);
  }
}
