<script setup>
import { ref, onMounted } from "vue";
const faceapi = window.faceapi;

const video = ref(null);
const canvas = ref(null);
const estado = ref("Cargando...");
const personaDetectada = ref(null);
let reconocimientoActivo = true;

async function cargarModelos() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
}

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
}

async function iniciarReconocimiento() {
  const personas = JSON.parse(localStorage.getItem("personas") || "[]");
  if (personas.length === 0) {
    estado.value = "No hay personas registradas";
    return;
  }

  const labeled = personas.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.nombre,
      [new Float32Array(p.descriptor)]
    )
  );

  const matcher = new faceapi.FaceMatcher(labeled, 0.5);

  setInterval(async () => {
    if (!reconocimientoActivo) return;

    const deteccion = await faceapi
      .detectSingleFace(video.value)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!deteccion) {
      estado.value = "Buscando rostro...";
      return;
    }

    const match = matcher.findBestMatch(deteccion.descriptor);
    if (match.label === "unknown") {
      estado.value = "Persona desconocida";
      return;
    }

    reconocimientoActivo = false;

    const persona = personas.find(p => p.nombre === match.label);
    const ctx = canvas.value.getContext("2d");
    ctx.drawImage(video.value, 0, 0, 300, 225);
    const foto = canvas.value.toDataURL("image/png");

    personaDetectada.value = persona;
    estado.value = `✔ Bienvenido ${persona.nombre}`;

    const asistencias = JSON.parse(localStorage.getItem("asistencias") || "[]");
    asistencias.push({
      nombre: persona.nombre,
      id: persona.id,
      fecha: new Date().toLocaleDateString(),
      hora: new Date().toLocaleTimeString(),
      foto,
    });

    localStorage.setItem("asistencias", JSON.stringify(asistencias));
  }, 800);
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  iniciarReconocimiento();
});
</script>
