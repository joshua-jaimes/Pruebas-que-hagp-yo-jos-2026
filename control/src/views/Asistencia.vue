<template>
  <div class="asistencia">
    <h2>📘 Asistencia Automática</h2>

    <video ref="video" autoplay playsinline class="video"></video>
    <canvas ref="canvas" width="300" height="225" style="display:none;"></canvas>

    <p class="estado">{{ estado }}</p>

    <div v-if="personaDetectada">
      <h3>✔ {{ personaDetectada.nombre }}</h3>
      <img :src="personaDetectada.foto" width="120" />
      <p>ASISTENCIA REGISTRADA</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const faceapi = window.faceapi;

const video = ref(null);
const canvas = ref(null);
const estado = ref("Cargando...");
const personaDetectada = ref(null);

async function cargarModelos() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
}

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
}

async function reconocer() {
  const personas = JSON.parse(localStorage.getItem("personas") || "[]");

  const labeled = personas.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.nombre,
      [new Float32Array(p.descriptor)]
    )
  );

  const matcher = new faceapi.FaceMatcher(labeled);

  setInterval(async () => {
    const deteccion = await faceapi
      .detectSingleFace(video.value, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!deteccion) return;

    const match = matcher.findBestMatch(deteccion.descriptor);
    if (match.label === "unknown") return;

    const persona = personas.find(p => p.nombre === match.label);

    const ctx = canvas.value.getContext("2d");
    ctx.drawImage(video.value, 0, 0, 300, 225);
    const fotoAsistencia = canvas.value.toDataURL("image/png");

    personaDetectada.value = { ...persona, foto: fotoAsistencia };

    const asistencias = JSON.parse(localStorage.getItem("asistencias") || "[]");
    const hoy = new Date().toLocaleDateString();

    if (!asistencias.some(a => a.id === persona.id && a.fecha === hoy)) {
      asistencias.push({
        nombre: persona.nombre,
        id: persona.id,
        fecha: hoy,
        hora: new Date().toLocaleTimeString(),
        foto: fotoAsistencia,
      });
      localStorage.setItem("asistencias", JSON.stringify(asistencias));
    }
  }, 1000);
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  reconocer();
});
</script>

<style>
.video {
  width: 300px;
  border: 2px solid #4b9be0;
}
</style>
