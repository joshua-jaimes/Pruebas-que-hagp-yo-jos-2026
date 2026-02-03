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

    <div class="lista-personas">
      <h3>📋 Personas Registradas</h3>
      <table v-if="personas.length > 0">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, index) in personas" :key="index">
            <td><img :src="p.foto" width="50" style="border-radius: 50%;" /></td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.id }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>No hay personas registradas.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { loadModels, faceapi } from "../faceapi.js";

const video = ref(null);
const canvas = ref(null);
const nombre = ref("");
const id = ref("");
const estado = ref("Cargando modelos...");
const rostroDetectado = ref(false);
const personas = ref([]);
const isDetecting = ref(false);

let descriptorActual = null;
let fotoBase64 = null;

async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.value.srcObject = stream;
    
    // Start detection only when video is actually playing
    video.value.onplay = () => {
      estado.value = "Cámara lista. Iniciando detección...";
      detectarRostro();
    };
  } catch (err) {
    estado.value = "Error al acceder a la cámara";
    console.error(err);
  }
}

function detectarRostro() {
  setInterval(async () => {
    // Basic checks before attempting detection
    if (!video.value || video.value.paused || video.value.ended) return;
    
    // Concurrency lock
    if (isDetecting.value) return;
    isDetecting.value = true;

    try {
      // Using SsdMobilenetv1 generally (loaded in faceapi.js shared loader)
      const deteccion = await faceapi
        .detectSingleFace(video.value) // defaults to SSD Mobilenet v1
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
    } catch (error) {
      console.error("Error en detección:", error);
      estado.value = "⚠️ Error en detección (Reintentando...)";
    } finally {
      isDetecting.value = false;
    }
  }, 500);
}

function cargarPersonas() {
  personas.value = JSON.parse(localStorage.getItem("personas") || "[]");
}

function guardarPersona() {
  if (!nombre.value || !id.value || !descriptorActual) {
    alert("Faltan datos o no se detectó el rostro");
    return;
  }

  const nuevaPersona = {
    nombre: nombre.value,
    id: id.value,
    descriptor: descriptorActual,
    foto: fotoBase64,
  };

  try {
    personas.value.push(nuevaPersona);
    localStorage.setItem("personas", JSON.stringify(personas.value));
    
    estado.value = "✅ Persona registrada";
    nombre.value = "";
    id.value = "";
    rostroDetectado.value = false; // Reset state
    descriptorActual = null;
  } catch (e) {
    console.error(e);
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert("⚠️ El almacenamiento local está lleno. No se pueden registrar más personas.");
      estado.value = "❌ Error: Almacenamiento lleno";
    } else {
      alert("Error al guardar: " + e.message);
      estado.value = "❌ Error al guardar";
    }
  }
}

onMounted(async () => {
  try {
    await loadModels();
    cargarPersonas();
    await iniciarCamara();
    // detectarRostro is now called via onplay inside iniciarCamara
  } catch (error) {
    console.error(error);
    estado.value = "❌ Error al cargar modelos o cámara: " + error.message;
  }
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
  margin-bottom: 20px;
}
.lista-personas {
  margin-top: 20px;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
th {
  background-color: #4b9be0;
  color: white;
}
</style>
