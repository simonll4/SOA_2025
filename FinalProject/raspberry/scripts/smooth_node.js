// Configuración del filtro
const HISTORICO_SIZE = 7; // Tamaño del histórico para mediana
const ALPHA = 0.3; // Factor de suavizado exponencial (0.1 a 0.5)

// Inicialización
const container = global.get("container");
const historico = flow.get("historico_distancia") || [];
const last_smoothed = flow.get("last_smoothed") || null;

// Validación con la altura real del recipiente
if (
  typeof msg.payload.distance_cm !== "number" ||
  msg.payload.distance_cm <= 0 ||
  msg.payload.distance_cm > container.height
) {
  node.warn(
    `Valor inválido descartado: ${msg.payload.distance_cm} (Altura máxima permitida: ${container.height})`
  );
  return null;
}

// // Validación básica (evita NaN o valores absurdos)
// if (typeof msg.payload.distance_cm !== "number" || msg.payload.distance_cm <= 0 || msg.payload.distance_cm > 500) {
//     node.warn(`Valor inválido descartado: ${msg.payload.distance_cm}`);
//     return null;  // Descarta el mensaje
// }

// 1. Añadir al histórico y aplicar filtro de mediana
historico.push(msg.payload.distance_cm);
if (historico.length > HISTORICO_SIZE) historico.shift();

const mediana = [...historico].sort((a, b) => a - b)[
  Math.floor(historico.length / 2)
];

// 2. Suavizado exponencial
const smoothed =
  last_smoothed !== null
    ? ALPHA * mediana + (1 - ALPHA) * last_smoothed
    : mediana;

// Guardar estado para próximo mensaje
flow.set("historico_distancia", historico);
flow.set("last_smoothed", smoothed);

// Actualizar el mensaje con el valor filtrado
msg.payload.distance_cm = smoothed;
msg.payload.temperature = msg.payload.temperature; // Mantener temperatura original

return msg;
