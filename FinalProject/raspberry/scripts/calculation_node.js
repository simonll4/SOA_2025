// // Retrieve container configuration
// const container = global.get("container");
// if (!container || !container.calibration_table || !container.height) {
//   node.error("Incomplete or missing container configuration");
//   return null;
// }

// const calibrationTable = container.calibration_table;
// const maxHeight = container.height;
// const maxVolume = calibrationTable[calibrationTable.length - 1].volume;

// // Get operation mode: 'load' (default) or 'discharge'
// const operationMode = flow.get("operation_mode") || "load";

// // Read or set reference height (distance from sensor to bottom of the container)
// let sensorToBottom = flow.get("sensor_to_bottom");
// const distance = msg.payload.distance_cm;
// const temperature = msg.payload.temperature;
// const timestamp = Date.now();

// if (sensorToBottom === null || sensorToBottom === undefined) {
//   sensorToBottom = distance;
//   flow.set("sensor_to_bottom", sensorToBottom);
//   node.warn(`Reference height saved: ${sensorToBottom} cm`);
// }

// // Calculate current liquid level
// let level = sensorToBottom - distance;
// let adjustedLevel = Math.max(0, Math.min(level, maxHeight)); // Clamp between 0 and container height

// // Linear interpolation for volume based on calibration table
// function interpolate(table, h) {
//   for (let i = 0; i < table.length - 1; i++) {
//     let a = table[i];
//     let b = table[i + 1];
//     if (h >= a.height && h <= b.height) {
//       let ratio = (h - a.height) / (b.height - a.height);
//       return a.volume + ratio * (b.volume - a.volume);
//     }
//   }
//   if (h <= table[0].height) return table[0].volume;
//   if (h >= table[table.length - 1].height)
//     return table[table.length - 1].volume;
//   return 0;
// }

// // Apply temperature compensation
// const beta = 0.000214;
// const referenceTemp = 20;
// const rawVolume = interpolate(calibrationTable, adjustedLevel);
// let adjustedVolume = rawVolume * (1 + beta * (temperature - referenceTemp));
// adjustedVolume = Math.max(0, Math.min(adjustedVolume, maxVolume)); // Clamp between 0 and max volume

// // Calculate flow rate and ETA
// const previous = context.get("previous") || {};
// const deltaTime = (timestamp - (previous.timestamp || timestamp)) / 1000;
// const deltaVolume = adjustedVolume - (previous.volume || adjustedVolume);
// const flowRate = deltaTime > 0 ? deltaVolume / deltaTime : 0;

// let ETA = 0;
// if (Math.abs(flowRate) > 0.001) {
//   if (operationMode === "load" && flowRate > 0) {
//     ETA = (maxVolume - adjustedVolume) / flowRate;
//   } else if (operationMode === "discharge" && flowRate < 0) {
//     ETA = adjustedVolume / Math.abs(flowRate);
//   }
// }

// // Save current state for next calculation
// context.set("previous", { timestamp, volume: adjustedVolume });

// // // Output message
// // msg.payload = {
// //   container_id: container.id,
// //   level_cm: adjustedLevel.toFixed(2),
// //   temperature_C: temperature,
// //   volume_L: adjustedVolume.toFixed(2),
// //   flow_rate_Lps: flowRate.toFixed(3),
// //   ETA_seconds: ETA.toFixed(1),
// //   timestamp: msg.payload.timestamp,
// // };

// // return msg;

// // Check completion conditions (NEW CODE)
// let completionStatus = null;
// const tolerance = 0.01 * maxVolume; // 1% tolerance for completion

// if (operationMode === "load") {
//   // For loading operation, check if container is full (within tolerance)
//   if (adjustedVolume >= maxVolume - tolerance) {
//     completionStatus = "filled";
//     node.log(
//       `Container filled (${adjustedVolume.toFixed(2)}L >= ${(
//         maxVolume - tolerance
//       ).toFixed(2)}L)`
//     );
//   }
// } else if (operationMode === "discharge") {
//   // For discharge operation, check if container is empty (within tolerance)
//   if (adjustedVolume <= tolerance) {
//     completionStatus = "emptied";
//     node.log(
//       `Container emptied (${adjustedVolume.toFixed(2)}L <= ${tolerance.toFixed(
//         2
//       )}L)`
//     );
//   }
// }

// // Al final de tu función actual:

// // Output message
// msg.payload = {
//   container_id: container.id,
//   level_cm: adjustedLevel.toFixed(2),
//   temperature_C: temperature,
//   volume_L: adjustedVolume.toFixed(2),
//   flow_rate_Lps: flowRate.toFixed(3),
//   ETA_seconds: ETA.toFixed(1),
//   timestamp: msg.payload.timestamp,
//   operation_mode: operationMode,
// };

// // Añadir propiedad de control de flujo
// if (completionStatus) {
//   msg.flowControl = {
//     shouldTerminate: true,
//     reason: completionStatus,
//     timestamp: new Date().toISOString(),
//   };
// } else {
//   msg.flowControl = {
//     shouldTerminate: false,
//   };
// }

// return msg;

const container = global.get("container");
if (!container || !container.calibration_table || !container.height) {
  node.error("Datos del recipiente incompletos o no definidos");
  return null;
}

const tabla = container.calibration_table;
const volumenMax = tabla[tabla.length - 1].volume;

// Leer o definir altura de referencia (sensor al fondo)
let alturaSensorFondo = flow.get("altura_sensor_fondo");
const distancia = msg.payload.distance_cm;
const T = msg.payload.temperature;
const ts = Date.now();

if (alturaSensorFondo === null || alturaSensorFondo === undefined) {
  // Guardar la primera distancia como referencia
  alturaSensorFondo = distancia;
  flow.set("altura_sensor_fondo", alturaSensorFondo);
  node.warn(`Altura de referencia guardada: ${alturaSensorFondo} cm`);
}

// Calcular altura del líquido (nivel actual)
const nivel = alturaSensorFondo - distancia;
const nivelAjustado = Math.max(0, nivel);

// Interpolación lineal para obtener volumen
function interpolar(tabla, h) {
  for (let i = 0; i < tabla.length - 1; i++) {
    let a = tabla[i];
    let b = tabla[i + 1];
    if (h >= a.height && h <= b.height) {
      let f = (h - a.height) / (b.height - a.height);
      return a.volume + f * (b.volume - a.volume);
    }
  }
  if (h <= tabla[0].height) return tabla[0].volume;
  if (h >= tabla[tabla.length - 1].height)
    return tabla[tabla.length - 1].volume;
  return 0;
}

// Volumen corregido por temperatura
const beta = 0.000214;
const tRef = 20;
const V0 = interpolar(tabla, nivelAjustado);
let Vadj = V0 * (1 + beta * (T - tRef));
Vadj = Math.max(0, Math.min(Vadj, volumenMax));

// Calcular caudal y ETA
const prev = context.get("prev") || {};
const deltaT = (ts - (prev.ts || ts)) / 1000;
const deltaV = Vadj - (prev.V || Vadj);
const Q = deltaT > 0 ? deltaV / deltaT : 0;

let ETA = 0;
if (Math.abs(Q) > 0.001) {
  ETA = Q > 0 ? (volumenMax - Vadj) / Q : Vadj / Math.abs(Q);
}

context.set("prev", { ts: ts, V: Vadj });

// Salida final
msg.payload = {
  id: container.id,
  nivel_cm: nivelAjustado.toFixed(2),
  temperatura_c: T,
  volumen_L: Vadj.toFixed(2),
  caudal_Lps: Q.toFixed(3),
  ETA_segundos: ETA.toFixed(1),
  timestamp: msg.payload.timestamp,
};

return msg;
