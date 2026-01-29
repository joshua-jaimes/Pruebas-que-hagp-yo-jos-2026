<script setup>
import { ref, onMounted } from "vue";
const faceapi = window.faceapi;

const video = ref(null);
const canvas = ref(null);
const nombre = ref("");
const id = ref("");
const estado = ref("Cargando modelos...");
const rostroDetectado = ref(false);

let deteccionActual = null;

async function cargarModelos() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
  estado.value = "Modelos cargados";
}

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
}

function detectarRostro() {
  setInterval(async () => {
    deteccionActual = await faceapi
      .detectSingleFace(video.value)
      .withFaceLandmarks()
      .withFaceDescriptor();

    rostroDetectado.value = !!deteccionActual;
    estado.value = deteccionActual ? "✔ Rostro detectado" : "Buscando rostro...";
  }, 700);
}

function guardarPersona() {
  if (!deteccionActual) return;

  const ctx = canvas.value.getContext("2d");
  ctx.drawImage(video.value, 0, 0, 300, 225);
  const foto = canvas.value.toDataURL("image/png");

  const personas = JSON.parse(localStorage.getItem("personas") || "[]");
  personas.push({
    nombre: nombre.value,
    id: id.value,
    descriptor: Array.from(deteccionActual.descriptor),
    foto,
  });

  localStorage.setItem("personas", JSON.stringify(personas));
  estado.value = "✅ Persona registrada correctamente";
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  detectarRostro();
});
</script>
