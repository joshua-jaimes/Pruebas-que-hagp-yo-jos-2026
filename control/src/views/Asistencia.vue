<template>
  <div class="asistencia">
    <h2>📘 Control de Asistencia</h2>

    <div style="position: relative; display: inline-block;">
        <video ref="video" autoplay playsinline class="video" :class="{ 'video-active': !personaDetectada }"></video>
        <div v-if="personaDetectada" style="position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); display:flex; align-items:center; justify-content:center; border-radius:12px;">
            <div style="text-align:center;">
                <span style="font-size: 3rem;">✅</span>
            </div>
        </div>
    </div>
    <canvas ref="canvas" width="300" height="225" style="display:none;"></canvas>

    <p class="estado" :style="{ color: personaDetectada ? 'green' : '#333' }">{{ estado }}</p>

    <div v-if="personaDetectada" class="card-success">
      <h3>¡Bienvenido/a {{ personaDetectada.nombre }}!</h3>
      <div style="display:flex; align-items:center; justify-content:center; gap:20px;">
          <img :src="personaDetectada.foto" width="100" style="border-radius:8px; border:2px solid #ccc;" />
          <div style="text-align:left;">
              <p><strong>ID:</strong> {{ personaDetectada.id }}</p>
              <p><strong>Hora:</strong> {{ personaDetectada.hora }}</p>
              <p style="color: green; font-weight: bold;">ASISTENCIA REGISTRADA</p>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { loadModels, faceapi } from "../faceapi.js";

const video = ref(null);
const canvas = ref(null);
const estado = ref("Cargando...");
const personaDetectada = ref(null);

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
}

async function reconocer() {
  const personas = JSON.parse(localStorage.getItem("personas") || "[]");

  if (personas.length === 0) {
      estado.value = "No hay personas registradas.";
      return;
  }

  const labeled = personas.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.nombre,
      [new Float32Array(p.descriptor)]
    )
  );

  const matcher = new faceapi.FaceMatcher(labeled);
  let detectando = false;

  setInterval(async () => {
    if (!video.value || !video.value.srcObject || detectando) return;
    detectando = true;

    try {
      const deteccion = await faceapi
        .detectSingleFace(video.value)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!deteccion) {
          detectando = false;
          return;
      }

      const match = matcher.findBestMatch(deteccion.descriptor);
      
      if (match.label === "unknown") {
          estado.value = "Persona desconocida (Intente acercarse más)";
          detectando = false;
          return;
      }

      const persona = personas.find(p => p.nombre === match.label);
      
      // Prevent rapid duplicate scans (wait 1 minute before allowing same person)
      const lastScan = localStorage.getItem(`last_scan_${persona.id}`);
      if (lastScan && Date.now() - parseInt(lastScan) < 60000) {
          estado.value = `Hola ${persona.nombre}, ya registraste asistencia recientemente.`;
          detectando = false;
          return;
      }

      const ctx = canvas.value.getContext("2d");
      ctx.drawImage(video.value, 0, 0, 300, 225);
      const fotoAsistencia = canvas.value.toDataURL("image/png");

      // Update UI to show success
      personaDetectada.value = { ...persona, foto: fotoAsistencia, hora: new Date().toLocaleTimeString() };
      
      // Save attendance
      const asistencias = JSON.parse(localStorage.getItem("asistencias") || "[]");
      const hoy = new Date().toLocaleDateString();
      const horaActual = new Date().toLocaleTimeString();

      asistencias.push({
        nombre: persona.nombre,
        id: persona.id,
        fecha: hoy,
        hora: horaActual,
        foto: fotoAsistencia,
      });
      localStorage.setItem("asistencias", JSON.stringify(asistencias));
      localStorage.setItem(`last_scan_${persona.id}`, Date.now().toString());

      estado.value = "✅ ASISTENCIA REGISTRADA EXITOSAMENTE";
      
      // Pause detection for a moment to show result
      setTimeout(() => {
          personaDetectada.value = null;
          estado.value = "Esperando siguiente persona...";
          detectando = false;
      }, 3000);

    } catch (error) {
        console.error("Error en detección:", error);
        detectando = false;
    }
    // Note: detectando is reset in setTimeout for success case, or immediately for others
    if (!personaDetectada.value) {
       detectando = false; 
    }
  }, 500);
}

onMounted(async () => {
  await loadModels();
  await iniciarCamara();
  reconocer();
});
</script>

<style>
.asistencia {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}
.video {
  width: 100%;
  max-width: 400px;
  border: 4px solid #ccc;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.video-active {
    border-color: #4b9be0;
}
.estado {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 1rem 0;
    min-height: 1.5rem;
}
.card-success {
    background: #e8f5e9;
    border: 2px solid #4caf50;
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
    animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
