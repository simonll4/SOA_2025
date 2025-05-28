const container = global.get("container");
if (!container || !container.calibration_table || !container.height) {
  node.error("Datos del recipiente incompletos o no definidos");
  return null;
}

const tabla = container.calibration_table;
const volumenMax = tabla[tabla.length - 1].volume;

// Configuración optimizada para suavizado
const TOLERANCIA_NIVEL_CERO = 0.1; // cm
const TOLERANCIA_NIVEL = 0.1; // cm
const TOLERANCIA_CAUDAL = 0.002; // L/s
const INTERVALO_MINIMO = 1; // segundos
const HISTERESIS = 0.05; // cm
const MIN_MUESTRAS_OPERACION = 5; // Más muestras para mayor estabilidad
const FACTOR_SUAVIZADO_PRINCIPAL = 0.4; // Suavizado principal
const FACTOR_SUAVIZADO_SECUNDARIO = 0.2; // Suavizado secundario
const TAMANO_HISTORIAL = 10; // Mayor historial para media móvil
const FACTOR_SUAVIZADO_ETA = 0.7; // Suavizado específico para ETA

// Leer datos del sensor
let alturaSensorFondo = container.sensor_height;
const distancia = parseFloat(msg.payload.distance_cm);
const T = parseFloat(msg.payload.temperature);
const ts = Date.now();

// Calcular altura del líquido con filtro de cero
const nivel = alturaSensorFondo - distancia;
let nivelAjustado = Math.max(0, nivel);

// Aplicar filtro de cero con histéresis
const prev = context.get("prev") || {};
if (nivelAjustado <= TOLERANCIA_NIVEL_CERO) {
  if ((prev.nivelAjustado || 0) <= TOLERANCIA_NIVEL_CERO + HISTERESIS) {
    nivelAjustado = 0;
  }
}

// Interpolación lineal para volumen
function interpolar(tabla, h) {
  for (let i = 0; i < tabla.length - 1; i++) {
    let a = tabla[i];
    let b = tabla[i + 1];
    if (h >= a.height && h <= b.height) {
      let f = (h - a.height) / (b.height - a.height);
      return a.volume + f * (b.volume - a.volume);
    }
  }
  return h <= tabla[0].height
    ? tabla[0].volume
    : tabla[tabla.length - 1].volume;
}

// Volumen corregido por temperatura
const beta = 0.000214;
const tRef = 20;
const V0 = interpolar(tabla, nivelAjustado);
let Vadj = V0 * (1 + beta * (T - tRef));
Vadj = Math.max(0, Math.min(Vadj, volumenMax));

if (nivelAjustado === 0) Vadj = 0;

// Calcular diferencias
const deltaT = (ts - (prev.ts || ts)) / 1000;
const deltaV = Vadj - (prev.V || Vadj);

// Obtener estado anterior
let estado = prev.estado || "reposo";
let Q = prev.Q || 0;
let ETA = prev.ETA || 0;
let contadorOperacion = prev.contadorOperacion || 0;
let historialQ = prev.historialQ || Array(TAMANO_HISTORIAL).fill(0);

// Solo procesar si ha pasado tiempo suficiente
if (deltaT >= INTERVALO_MINIMO) {
  // Calcular caudal temporal
  const Qtemp = deltaT > 0 ? deltaV / deltaT : 0;

  // Actualizar historial de caudales
  historialQ.shift();
  historialQ.push(Qtemp);

  // 1. Calcular media móvil del historial
  const mediaMovil =
    historialQ.reduce((sum, val) => sum + val, 0) / historialQ.length;

  // 2. Aplicar doble suavizado exponencial
  const Qfiltrado1 =
    FACTOR_SUAVIZADO_PRINCIPAL * Qtemp +
    (1 - FACTOR_SUAVIZADO_PRINCIPAL) * (prev.Q || 0);
  const Qfiltrado2 =
    FACTOR_SUAVIZADO_SECUNDARIO * mediaMovil +
    (1 - FACTOR_SUAVIZADO_SECUNDARIO) * Qfiltrado1;

  // 3. Combinación ponderada de ambos métodos
  const Qfiltrado = 0.7 * Qfiltrado2 + 0.3 * mediaMovil;

  // Detección de operación con umbral más estable
  const umbralOperacion = TOLERANCIA_CAUDAL * 1.5;
  if (Math.abs(Qfiltrado) > umbralOperacion) {
    contadorOperacion = Math.min(
      contadorOperacion + 1,
      MIN_MUESTRAS_OPERACION * 2
    );
  } else {
    contadorOperacion = Math.max(contadorOperacion - 1, 0);
  }

  // Solo cambiar estado si tenemos suficiente confianza
  if (contadorOperacion >= MIN_MUESTRAS_OPERACION) {
    Q = Qfiltrado;
    estado =
      Q < -TOLERANCIA_CAUDAL
        ? "vaciado"
        : Q > TOLERANCIA_CAUDAL
        ? "llenado"
        : "reposo";

    // Cálculo suavizado del ETA
    if (Math.abs(Q) > TOLERANCIA_CAUDAL * 2 && isFinite(Q)) {
      if (estado === "llenado" && Vadj < volumenMax * 0.99) {
        const rawETA = (volumenMax - Vadj) / Q;
        ETA = prev.ETA
          ? FACTOR_SUAVIZADO_ETA * rawETA +
            (1 - FACTOR_SUAVIZADO_ETA) * prev.ETA
          : rawETA;
      } else if (estado === "vaciado" && Vadj > volumenMax * 0.01) {
        const rawETA = Vadj / Math.abs(Q);
        ETA = prev.ETA
          ? FACTOR_SUAVIZADO_ETA * rawETA +
            (1 - FACTOR_SUAVIZADO_ETA) * prev.ETA
          : rawETA;
      }
    } else {
      ETA = prev.ETA || 0; // Mantener último ETA válido
    }
  } else if (contadorOperacion === 0) {
    estado = "reposo";
    Q = 0;
    // Reducir ETA gradualmente en lugar de resetearlo
    ETA = prev.ETA ? prev.ETA * 0.9 : 0;
  }
}

// Guardar estado para próxima iteración
context.set("prev", {
  ts: ts,
  V: Vadj,
  nivelAjustado: nivelAjustado,
  estado: estado,
  Q: Q,
  ETA: ETA,
  contadorOperacion: contadorOperacion,
  historialQ: historialQ,
});

// Función para formatear valores
function formatValue(value, decimals) {
  return Math.abs(value) < Math.pow(10, -decimals) ? 0 : value;
}

// Datos de depuración
msg.debug = {
  deltaT: deltaT.toFixed(2),
  deltaV: deltaV.toFixed(4),
  Qtemp: (deltaT > 0 ? deltaV / deltaT : 0).toFixed(4),
  volumen: Vadj.toFixed(4),
  nivel: nivelAjustado.toFixed(2),
  media_movil: (
    historialQ.reduce((sum, val) => sum + val, 0) / historialQ.length
  ).toFixed(4),
  estado: estado,
  contador: contadorOperacion,
};

// Salida final con mejor formato
msg.payload = {
  id: container.id,
  nivel_cm: formatValue(nivelAjustado, 1).toFixed(1),
  temperatura_c: T.toFixed(1),
  volumen_L: formatValue(Vadj, 1).toFixed(1),
  // caudal_Lps: estado !== "reposo" ? formatValue(Math.abs(Q), 3).toFixed(3) : "0.000", // Más decimales para ver suavizado
  caudal_Lps: estado !== "reposo" ? formatValue(Q, 3).toFixed(3) : "0.000",
  ETA_segundos: estado !== "reposo" ? Math.max(0, Math.round(ETA)) : "0",
  timestamp: msg.payload.timestamp || new Date(ts).toISOString(),
};

return msg;
