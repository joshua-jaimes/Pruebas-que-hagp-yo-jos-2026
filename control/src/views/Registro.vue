<template>
  <div class="registro">
    <h2>Registrar Persona</h2>

    <video ref="video" autoplay playsinline class="video"></video>
    <canvas ref="canvas" width="300" height="225" style="display:none;"></canvas>

    <p class="estado">{{ estado }}</p>

    <div class="form">
      <input v-model="nombre" placeholder="Nombre" />
      <input v-model="id" placeholder="ID" />
      <button @click="guardarPersona" :disabled="!rostroDetectado">
        Guardar Registro
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const faceapi = window.faceapi;

const video = ref(null);
const canvas = ref(null);
const nombre = ref("");
const id = ref("");
const estado = ref("Cargando modelos...");
const rostroDetectado = ref(false);

let descriptorActual = null;
let fotoBase64 = null;

async function cargarModelos() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
}

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
}

function detectarRostro() {
  setInterval(async () => {
    const deteccion = await faceapi
      .detectSingleFace(video.value)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (deteccion) {
      rostroDetectado.value = true;
      estado.value = "✔ Rostro detectado";
      descriptorActual = Array.from(deteccion.descriptor);

      const ctx = canvas.value.getContext("2d");
      ctx.drawImage(video.value, 0, 0, 300, 225);
      fotoBase64 = canvas.value.toDataURL("image/png");
    } else {
      estado.value = "Buscando rostro...";
      rostroDetectado.value = false;
    }
  }, 800);
}

function guardarPersona() {
  const personas = JSON.parse(localStorage.getItem("personas") || "[]");

  personas.push({
    nombre: nombre.value,
    id: id.value,
    descriptor: descriptorActual,
    foto: fotoBase64,
  });

  localStorage.setItem("personas", JSON.stringify(personas));
  estado.value = "✅ Persona registrada";
  nombre.value = "";
  id.value = "";
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  detectarRostro();
});
</script>

<style>
.video {
  width: 300px;
  border: 2px solid #4b9be0;
  border-radius: 10px;
}
.form {
  margin-top: 10px;
}
</style>
