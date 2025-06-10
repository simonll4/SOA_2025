const container = global.get("container");
if (
  !container ||
  !container.calibration_table ||
  !container.height ||
  !container.thresholds
) {
  node.error("Datos del recipiente incompletos o no definidos");
  return null;
}

// 1. CONFIGURACIÓN AJUSTADA PARA INICIALIZACIÓN ÓPTIMA
const config = {
  TOLERANCIA_NIVEL_CERO: 0.05,
  TOLERANCIA_CAUDAL: 0.005,
  TOLERANCIA_UMBRAL: 0.01,

  INTERVALO_MINIMO: 0.5,
  RETRASO_ESTABILIZACION: 3, 

  HISTERESIS: 0.05,
  MIN_MUESTRAS_OPERACION: 1,
  TAMANO_HISTORIAL: 5,

  FACTOR_SUAVIZADO_PRINCIPAL: 0.5,
  FACTOR_SUAVIZADO_SECUNDARIO: 0.3,
  FACTOR_SUAVIZADO_ETA: 0.4,
  FACTOR_SUAVIZADO_NIVEL: 0.4,

  MAX_ETA: 24 * 3600,
  NIVEL_MAX_OVERSHOOT: 0.5,
};

// 2. DATOS BÁSICOS
const tabla = container.calibration_table;
const volumenMax = tabla[tabla.length - 1].volume;
const alturaMax = tabla[tabla.length - 1].height;

// 3. UMBRALES (sin cambios)
function calcularUmbrales() {
  const thresholds = container.thresholds;
  const h_h_volumen = interpolar(tabla, thresholds.high_high * alturaMax);
  const l_l_volumen = interpolar(tabla, thresholds.low_low * alturaMax);
  const h_h_volumen_tol = h_h_volumen - volumenMax * config.TOLERANCIA_UMBRAL;
  const l_l_volumen_tol = l_l_volumen + volumenMax * config.TOLERANCIA_UMBRAL;

  return {
    h_h: h_h_volumen,
    l_l: l_l_volumen,
    h_h_tol: h_h_volumen_tol,
    l_l_tol: l_l_volumen_tol,
    h_h_nivel: thresholds.high_high * alturaMax,
    l_l_nivel: thresholds.low_low * alturaMax,
  };
}

const umbrales = calcularUmbrales();

// 4. INTERPOLACIÓN CON VALIDACIÓN MEJORADA
function interpolar(tabla, h) {
  if (!tabla || tabla.length === 0) return 0;
  h = Math.max(0, h); // Asegura valor positivo

  if (h <= tabla[0].height) return tabla[0].volume;
  if (h >= tabla[tabla.length - 1].height)
    return tabla[tabla.length - 1].volume;

  for (let i = 0; i < tabla.length - 1; i++) {
    if (h >= tabla[i].height && h <= tabla[i + 1].height) {
      const f = (h - tabla[i].height) / (tabla[i + 1].height - tabla[i].height);
      return tabla[i].volume + f * (tabla[i + 1].volume - tabla[i].volume);
    }
  }
  return volumenMax;
}

// 5. ESTADO ANTERIOR CON INICIALIZACIÓN MEJORADA
const alturaSensorFondo = container.sensor_height;
const distancia = parseFloat(msg.payload.distance_cm);
const nivelBruto = Math.max(0, alturaSensorFondo - distancia);
const T = parseFloat(msg.payload.temperature);
const ts = Date.now();

const prev = context.get("prev") || {
  historialNivel: Array(config.TAMANO_HISTORIAL).fill(nivelBruto), // Inicializa con valor actual
  historialQ: Array(config.TAMANO_HISTORIAL).fill(0),
  ultimoEstable: {
    nivel: nivelBruto,
    volumen: interpolar(tabla, nivelBruto),
    ts: ts,
  },
  V: interpolar(tabla, nivelBruto), // Inicializa con volumen actual
  initialized: false, // Bandera de inicialización
};

// 6. DATOS ACTUALES Y NIVEL AJUSTADO
const nivelAjustado =
  nivelBruto <= config.TOLERANCIA_NIVEL_CERO ? 0 : nivelBruto;

// Suavizado del nivel con inicialización mejorada
prev.historialNivel.shift();
prev.historialNivel.push(nivelAjustado);
const nivelFiltrado =
  Math.round(
    (prev.historialNivel.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL) *
      100
  ) / 100;

// 7. VOLUMEN AJUSTADO CON MEJOR MANEJO INICIAL
const beta = 0.000214;
const tRef = 20;
const V0 = interpolar(tabla, nivelFiltrado);
let Vadj = V0 * (1 + beta * (T - tRef));
Vadj = Math.max(0, Math.min(Vadj, volumenMax));
if (nivelAjustado === 0) Vadj = 0;

// 8. CAUDAL CON INICIALIZACIÓN SUAVIZADA
const deltaT = Math.max(0.1, (ts - (prev.ts || ts)) / 1000);
let deltaV = Vadj - (prev.V || Vadj);

// Suavizamos el primer cálculo de caudal
if (!prev.initialized) {
  deltaV = 0; // Forzamos caudal cero en la primera iteración
  prev.initialized = true; // Marcamos como inicializado
}

const Qtemp = deltaV / deltaT;
const mediaMovil =
  prev.historialQ.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL;
const Q =
  config.FACTOR_SUAVIZADO_PRINCIPAL * Qtemp +
  (1 - config.FACTOR_SUAVIZADO_PRINCIPAL) * mediaMovil;

prev.historialQ.shift();
prev.historialQ.push(Qtemp);

// 9. ESTADO ACTUAL CON HISTERESIS MEJORADA
let estado;
const umbralSuperior = config.TOLERANCIA_CAUDAL * (1 + config.HISTERESIS);
const umbralInferior = config.TOLERANCIA_CAUDAL * (1 - config.HISTERESIS);

if (!prev.estado || prev.estado === "reposo") {
  if (Math.abs(Q) > umbralSuperior) {
    estado = Q < 0 ? "vaciado" : "llenado";
  } else {
    estado = "reposo";
  }
} else {
  if (Math.abs(Q) < umbralInferior) {
    estado = "reposo";
  } else {
    estado = prev.estado;
  }
}

// 10. ETA
let ETA = prev.ETA || 0;
if (Math.abs(Q) > config.TOLERANCIA_CAUDAL && isFinite(Q)) {
  if (estado === "llenado") {
    const volumenObjetivo = Math.min(
      umbrales.h_h,
      volumenMax - config.NIVEL_MAX_OVERSHOOT
    );
    const rawETA = Vadj >= volumenObjetivo ? 0 : (volumenObjetivo - Vadj) / Q;
    ETA =
      config.FACTOR_SUAVIZADO_ETA * rawETA +
      (1 - config.FACTOR_SUAVIZADO_ETA) * (prev.ETA || rawETA);
  } else if (estado === "vaciado") {
    const rawETA =
      Vadj <= umbrales.l_l_tol ? 0 : (Vadj - umbrales.l_l) / Math.abs(Q);
    ETA =
      config.FACTOR_SUAVIZADO_ETA * rawETA +
      (1 - config.FACTOR_SUAVIZADO_ETA) * (prev.ETA || rawETA);
  }
  ETA = Math.min(Math.max(0, ETA), config.MAX_ETA);
} else {
  ETA = prev.ETA ? prev.ETA * 0.9 : 0;
}

// 11. NIVEL ESTABLE
if (Math.abs(Q) < config.TOLERANCIA_CAUDAL) {
  if (!prev.tsEstable) prev.tsEstable = ts;
  if (ts - prev.tsEstable >= config.RETRASO_ESTABILIZACION * 1000) {
    prev.ultimoEstable = { nivel: nivelFiltrado, volumen: Vadj, ts: ts };
  }
} else {
  prev.tsEstable = null;
}

// 12. ACTUALIZAR CONTEXTO
prev.ts = ts;
prev.V = Vadj;
prev.nivelAjustado = nivelFiltrado;
prev.estado = estado;
prev.Q = estado !== "reposo" ? Q : 0;
prev.ETA = ETA;

// 12. ACTUALIZAR CONTEXTO
prev.ts = ts;
prev.V = Vadj;
prev.nivelAjustado = nivelFiltrado;
prev.estado = estado;
prev.Q = estado !== "reposo" ? Q : 0;
prev.ETA = ETA;

// 13. FORMATOS
function formatValue(value, decimals) {
  if (value === undefined || value === null) return "0.000";
  const lim = Math.pow(10, -decimals);
  return value > -lim && value < lim ? "0.000" : value.toFixed(decimals);
}

function formatValueCaudal(value, decimals) {
  if (value === undefined || value === null) return "0.0000";
  return value.toFixed(decimals);
}

// 14. SALIDA
const payload = {
  id: container.id,
  nivel_cm: formatValue(nivelFiltrado, 1),
  temperatura_c: T.toFixed(1),
  volumen_L: formatValue(Vadj, 1),
  caudal_Lps: prev.estado !== "reposo" ? formatValueCaudal(prev.Q, 3) : "0.000",
  ETA_segundos:
    prev.estado !== "reposo" ? Math.max(0, Math.round(prev.ETA)) : "0",
  estado: prev.estado,
  timestamp: msg.payload.timestamp || new Date(ts).toISOString(),
};

context.set("prev", prev);
msg.payload = payload;
return msg;

// const container = global.get("container");
// if (
//   !container ||
//   !container.calibration_table ||
//   !container.height ||
//   !container.thresholds
// ) {
//   node.error("Datos del recipiente incompletos o no definidos");
//   return null;
// }

// // 1. CONFIGURACIÓN AJUSTADA PARA INICIALIZACIÓN ÓPTIMA
// const config = {
//   TOLERANCIA_NIVEL_CERO: 0.05,
//   TOLERANCIA_CAUDAL: 0.005,
//   TOLERANCIA_UMBRAL: 0.01,

//   INTERVALO_MINIMO: 0.5,
//   RETRASO_ESTABILIZACION: 3, // Aumentado para mejor estabilidad inicial

//   HISTERESIS: 0.05,
//   MIN_MUESTRAS_OPERACION: 1,
//   TAMANO_HISTORIAL: 5, // Mayor ventana para suavizado inicial

//   FACTOR_SUAVIZADO_PRINCIPAL: 0.5, // Más peso al historial al inicio
//   FACTOR_SUAVIZADO_SECUNDARIO: 0.3,
//   FACTOR_SUAVIZADO_ETA: 0.4,
//   FACTOR_SUAVIZADO_NIVEL: 0.4, // Más filtrado para nivel inicial

//   MAX_ETA: 24 * 3600,
//   NIVEL_MAX_OVERSHOOT: 0.5,
// };

// // 2. DATOS BÁSICOS
// const tabla = container.calibration_table;
// const volumenMax = tabla[tabla.length - 1].volume;
// const alturaMax = tabla[tabla.length - 1].height;

// // 3. UMBRALES (sin cambios)
// function calcularUmbrales() {
//   const thresholds = container.thresholds;
//   const h_h_volumen = interpolar(tabla, thresholds.high_high * alturaMax);
//   const l_l_volumen = interpolar(tabla, thresholds.low_low * alturaMax);
//   const h_h_volumen_tol = h_h_volumen - volumenMax * config.TOLERANCIA_UMBRAL;
//   const l_l_volumen_tol = l_l_volumen + volumenMax * config.TOLERANCIA_UMBRAL;

//   return {
//     h_h: h_h_volumen,
//     l_l: l_l_volumen,
//     h_h_tol: h_h_volumen_tol,
//     l_l_tol: l_l_volumen_tol,
//     h_h_nivel: thresholds.high_high * alturaMax,
//     l_l_nivel: thresholds.low_low * alturaMax,
//   };
// }

// const umbrales = calcularUmbrales();

// // 4. INTERPOLACIÓN CON VALIDACIÓN MEJORADA
// function interpolar(tabla, h) {
//   if (!tabla || tabla.length === 0) return 0;
//   h = Math.max(0, h); // Asegura valor positivo

//   if (h <= tabla[0].height) return tabla[0].volume;
//   if (h >= tabla[tabla.length - 1].height)
//     return tabla[tabla.length - 1].volume;

//   for (let i = 0; i < tabla.length - 1; i++) {
//     if (h >= tabla[i].height && h <= tabla[i + 1].height) {
//       const f = (h - tabla[i].height) / (tabla[i + 1].height - tabla[i].height);
//       return tabla[i].volume + f * (tabla[i + 1].volume - tabla[i].volume);
//     }
//   }
//   return volumenMax;
// }

// // 5. ESTADO ANTERIOR CON INICIALIZACIÓN MEJORADA
// const alturaSensorFondo = container.sensor_height;
// const distancia = parseFloat(msg.payload.distance_cm);
// const nivelBruto = Math.max(0, alturaSensorFondo - distancia);
// const T = parseFloat(msg.payload.temperature);
// const ts = Date.now();

// const prev = context.get("prev") || {
//   historialNivel: Array(config.TAMANO_HISTORIAL).fill(nivelBruto), // Inicializa con valor actual
//   historialQ: Array(config.TAMANO_HISTORIAL).fill(0),
//   ultimoEstable: {
//     nivel: nivelBruto,
//     volumen: interpolar(tabla, nivelBruto),
//     ts: ts,
//   },
//   V: interpolar(tabla, nivelBruto), // Inicializa con volumen actual
//   initialized: false, // Bandera de inicialización
// };

// // 6. DATOS ACTUALES Y NIVEL AJUSTADO
// const nivelAjustado =
//   nivelBruto <= config.TOLERANCIA_NIVEL_CERO ? 0 : nivelBruto;

// // Suavizado del nivel con inicialización mejorada
// prev.historialNivel.shift();
// prev.historialNivel.push(nivelAjustado);
// const nivelFiltrado =
//   prev.historialNivel.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL;

// // 7. VOLUMEN AJUSTADO CON MEJOR MANEJO INICIAL
// const beta = 0.000214;
// const tRef = 20;
// const V0 = interpolar(tabla, nivelFiltrado);
// let Vadj = V0 * (1 + beta * (T - tRef));
// Vadj = Math.max(0, Math.min(Vadj, volumenMax));
// if (nivelAjustado === 0) Vadj = 0;

// // 8. CAUDAL CON INICIALIZACIÓN SUAVIZADA
// const deltaT = Math.max(0.1, (ts - (prev.ts || ts)) / 1000);
// let deltaV = Vadj - (prev.V || Vadj);

// // Suavizamos el primer cálculo de caudal
// if (!prev.initialized) {
//   deltaV = 0; // Forzamos caudal cero en la primera iteración
//   prev.initialized = true; // Marcamos como inicializado
// }

// const Qtemp = deltaV / deltaT;
// const mediaMovil =
//   prev.historialQ.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL;
// const Q =
//   config.FACTOR_SUAVIZADO_PRINCIPAL * Qtemp +
//   (1 - config.FACTOR_SUAVIZADO_PRINCIPAL) * mediaMovil;

// prev.historialQ.shift();
// prev.historialQ.push(Qtemp);

// // 9. ESTADO ACTUAL CON HISTERESIS MEJORADA
// let estado;
// const umbralSuperior = config.TOLERANCIA_CAUDAL * (1 + config.HISTERESIS);
// const umbralInferior = config.TOLERANCIA_CAUDAL * (1 - config.HISTERESIS);

// if (!prev.estado || prev.estado === "reposo") {
//   if (Math.abs(Q) > umbralSuperior) {
//     estado = Q < 0 ? "vaciado" : "llenado";
//   } else {
//     estado = "reposo";
//   }
// } else {
//   if (Math.abs(Q) < umbralInferior) {
//     estado = "reposo";
//   } else {
//     estado = prev.estado;
//   }
// }

// // 10. ETA
// let ETA = prev.ETA || 0;
// if (Math.abs(Q) > config.TOLERANCIA_CAUDAL && isFinite(Q)) {
//   if (estado === "llenado") {
//     const volumenObjetivo = Math.min(
//       umbrales.h_h,
//       volumenMax - config.NIVEL_MAX_OVERSHOOT
//     );
//     const rawETA = Vadj >= volumenObjetivo ? 0 : (volumenObjetivo - Vadj) / Q;
//     ETA =
//       config.FACTOR_SUAVIZADO_ETA * rawETA +
//       (1 - config.FACTOR_SUAVIZADO_ETA) * (prev.ETA || rawETA);
//   } else if (estado === "vaciado") {
//     const rawETA =
//       Vadj <= umbrales.l_l_tol ? 0 : (Vadj - umbrales.l_l) / Math.abs(Q);
//     ETA =
//       config.FACTOR_SUAVIZADO_ETA * rawETA +
//       (1 - config.FACTOR_SUAVIZADO_ETA) * (prev.ETA || rawETA);
//   }
//   ETA = Math.min(Math.max(0, ETA), config.MAX_ETA);
// } else {
//   ETA = prev.ETA ? prev.ETA * 0.9 : 0;
// }

// // 11. NIVEL ESTABLE
// if (Math.abs(Q) < config.TOLERANCIA_CAUDAL) {
//   if (!prev.tsEstable) prev.tsEstable = ts;
//   if (ts - prev.tsEstable >= config.RETRASO_ESTABILIZACION * 1000) {
//     prev.ultimoEstable = { nivel: nivelFiltrado, volumen: Vadj, ts: ts };
//   }
// } else {
//   prev.tsEstable = null;
// }

// // 12. ACTUALIZAR CONTEXTO
// prev.ts = ts;
// prev.V = Vadj;
// prev.nivelAjustado = nivelFiltrado;
// prev.estado = estado;
// prev.Q = estado !== "reposo" ? Q : 0;
// prev.ETA = ETA;

// // 12. ACTUALIZAR CONTEXTO
// prev.ts = ts;
// prev.V = Vadj;
// prev.nivelAjustado = nivelFiltrado;
// prev.estado = estado;
// prev.Q = estado !== "reposo" ? Q : 0;
// prev.ETA = ETA;

// // 13. FORMATOS (sin cambios)
// function formatValue(value, decimals) {
//   if (value === undefined || value === null) return "0.000";
//   const lim = Math.pow(10, -decimals);
//   return value > -lim && value < lim ? "0.000" : value.toFixed(decimals);
// }

// function formatValueCaudal(value, decimals) {
//   if (value === undefined || value === null) return "0.0000";
//   return value.toFixed(decimals);
// }

// // 14. SALIDA
// const payload = {
//   id: container.id,
//   nivel_cm: formatValue(nivelFiltrado, 2),
//   temperatura_c: T.toFixed(1),
//   volumen_L: formatValue(Vadj, 2),
//   caudal_Lps: prev.estado !== "reposo" ? formatValueCaudal(prev.Q, 4) : "0.000",
//   ETA_segundos:
//     prev.estado !== "reposo" ? Math.max(0, Math.round(prev.ETA)) : "0",
//   estado: prev.estado,
//   timestamp: msg.payload.timestamp || new Date(ts).toISOString(),
// };

// context.set("prev", prev);
// msg.payload = payload;
// return msg;

// // const container = global.get("container");
// // if (
// //   !container ||
// //   !container.calibration_table ||
// //   !container.height ||
// //   !container.thresholds
// // ) {
// //   node.error("Datos del recipiente incompletos o no definidos");
// //   return null;
// // }

// // // 1. CONFIGURACIÓN AJUSTADA
// // const config = {
// //   TOLERANCIA_NIVEL_CERO: 0.05,
// //   TOLERANCIA_CAUDAL: 0.005,
// //   TOLERANCIA_UMBRAL: 0.01,

// //   INTERVALO_MINIMO: 0.5,
// //   RETRASO_ESTABILIZACION: 2,

// //   HISTERESIS: 0.05,
// //   MIN_MUESTRAS_OPERACION: 1,
// //   TAMANO_HISTORIAL: 3,

// //   FACTOR_SUAVIZADO_PRINCIPAL: 0.7,
// //   FACTOR_SUAVIZADO_SECUNDARIO: 0.3,
// //   FACTOR_SUAVIZADO_ETA: 0.4,
// //   FACTOR_SUAVIZADO_NIVEL: 0.3,

// //   MAX_ETA: 24 * 3600,
// //   NIVEL_MAX_OVERSHOOT: 0.5,
// // };

// // // 2. DATOS BÁSICOS
// // const tabla = container.calibration_table;
// // const volumenMax = tabla[tabla.length - 1].volume;
// // const alturaMax = tabla[tabla.length - 1].height;

// // // 3. UMBRALES
// // function calcularUmbrales() {
// //   const thresholds = container.thresholds;
// //   const h_h_volumen = interpolar(tabla, thresholds.high_high * alturaMax);
// //   const l_l_volumen = interpolar(tabla, thresholds.low_low * alturaMax);
// //   const h_h_volumen_tol = h_h_volumen - volumenMax * config.TOLERANCIA_UMBRAL;
// //   const l_l_volumen_tol = l_l_volumen + volumenMax * config.TOLERANCIA_UMBRAL;

// //   return {
// //     h_h: h_h_volumen,
// //     l_l: l_l_volumen,
// //     h_h_tol: h_h_volumen_tol,
// //     l_l_tol: l_l_volumen_tol,
// //     h_h_nivel: thresholds.high_high * alturaMax,
// //     l_l_nivel: thresholds.low_low * alturaMax,
// //   };
// // }

// // const umbrales = calcularUmbrales();

// // // 4. INTERPOLACIÓN
// // function interpolar(tabla, h) {
// //   if (h <= tabla[0].height) return tabla[0].volume;
// //   if (h >= tabla[tabla.length - 1].height)
// //     return tabla[tabla.length - 1].volume;

// //   for (let i = 0; i < tabla.length - 1; i++) {
// //     if (h >= tabla[i].height && h <= tabla[i + 1].height) {
// //       const f = (h - tabla[i].height) / (tabla[i + 1].height - tabla[i].height);
// //       return tabla[i].volume + f * (tabla[i + 1].volume - tabla[i].volume);
// //     }
// //   }
// //   return volumenMax;
// // }

// // // 5. ESTADO ANTERIOR
// // const prev = context.get("prev") || {
// //   historialNivel: Array(config.TAMANO_HISTORIAL).fill(0),
// //   historialQ: Array(config.TAMANO_HISTORIAL).fill(0),
// //   ultimoEstable: { nivel: 0, volumen: 0, ts: 0 },
// // };

// // // 6. DATOS ACTUALES
// // const alturaSensorFondo = container.sensor_height;
// // const distancia = parseFloat(msg.payload.distance_cm);
// // const T = parseFloat(msg.payload.temperature);
// // const ts = Date.now();

// // // Nivel ajustado
// // const nivelBruto = Math.max(0, alturaSensorFondo - distancia);
// // const nivelAjustado =
// //   nivelBruto <= config.TOLERANCIA_NIVEL_CERO ? 0 : nivelBruto;

// // // Suavizado del nivel
// // prev.historialNivel.shift();
// // prev.historialNivel.push(nivelAjustado);
// // //const nivelFiltrado =
// // //prev.historialNivel.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL;
// // const nivelFiltrado =
// //   Math.round(
// //     (prev.historialNivel.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL) *
// //       100
// //   ) / 100;

// // // 7. VOLUMEN AJUSTADO
// // const beta = 0.000214;
// // const tRef = 20;
// // const V0 = interpolar(tabla, nivelFiltrado);
// // let Vadj = V0 * (1 + beta * (T - tRef));
// // Vadj = Math.max(0, Math.min(Vadj, volumenMax));
// // if (nivelAjustado === 0) Vadj = 0;

// // // 8. CAUDAL
// // const deltaT = Math.max(0.1, (ts - (prev.ts || ts)) / 1000);
// // const deltaV = Vadj - (prev.V || Vadj);
// // const Qtemp = deltaV / deltaT;

// // // node.warn(ΔV=${deltaV.toFixed(5)}, ΔT=${deltaT.toFixed(3)}, Qtemp=${Qtemp.toFixed(5)});

// // const mediaMovil =
// //   prev.historialQ.reduce((s, v) => s + v, 0) / config.TAMANO_HISTORIAL;
// // const Q =
// //   config.FACTOR_SUAVIZADO_PRINCIPAL * Qtemp +
// //   (1 - config.FACTOR_SUAVIZADO_PRINCIPAL) * mediaMovil;

// // prev.historialQ.shift();
// // prev.historialQ.push(Qtemp);

// // // 9. ESTADO ACTUAL SIMPLIFICADO
// // let estado;
// // if (Math.abs(Q) > config.TOLERANCIA_CAUDAL) {
// //   estado = Q < 0 ? "vaciado" : "llenado";
// // } else {
// //   estado = "reposo";
// // }

// // // 10. ETA
// // let ETA = prev.ETA || 0;
// // if (Math.abs(Q) > config.TOLERANCIA_CAUDAL && isFinite(Q)) {
// //   if (estado === "llenado") {
// //     const volumenObjetivo = Math.min(
// //       umbrales.h_h,
// //       volumenMax - config.NIVEL_MAX_OVERSHOOT
// //     );
// //     const rawETA = Vadj >= volumenObjetivo ? 0 : (volumenObjetivo - Vadj) / Q;
// //     ETA =
// //       config.FACTOR_SUAVIZADO_ETA * rawETA +
// //       (1 - config.FACTOR_SUAVIZADO_ETA) * (prev.ETA || rawETA);
// //   } else if (estado === "vaciado") {
// //     const rawETA =
// //       Vadj <= umbrales.l_l_tol ? 0 : (Vadj - umbrales.l_l) / Math.abs(Q);
// //     ETA =
// //       config.FACTOR_SUAVIZADO_ETA * rawETA +
// //       (1 - config.FACTOR_SUAVIZADO_ETA) * (prev.ETA || rawETA);
// //   }
// //   ETA = Math.min(Math.max(0, ETA), config.MAX_ETA);
// // } else {
// //   ETA = prev.ETA ? prev.ETA * 0.9 : 0;
// // }

// // // 11. NIVEL ESTABLE
// // if (Math.abs(Q) < config.TOLERANCIA_CAUDAL) {
// //   if (!prev.tsEstable) prev.tsEstable = ts;
// //   if (ts - prev.tsEstable >= config.RETRASO_ESTABILIZACION * 1000) {
// //     prev.ultimoEstable = { nivel: nivelFiltrado, volumen: Vadj, ts: ts };
// //   }
// // } else {
// //   prev.tsEstable = null;
// // }

// // // 12. ACTUALIZAR CONTEXTO
// // prev.ts = ts;
// // prev.V = Vadj;
// // prev.nivelAjustado = nivelFiltrado;
// // prev.estado = estado;
// // prev.Q = estado !== "reposo" ? Q : 0;
// // prev.ETA = ETA;

// // // 13. FORMATOS
// // function formatValue(value, decimals) {
// //   if (value === undefined || value === null) return "0.000";
// //   const lim = Math.pow(10, -decimals);
// //   return value > -lim && value < lim ? "0.000" : value.toFixed(decimals);
// // }

// // function formatValueCaudal(value, decimals) {
// //   if (value === undefined || value === null) return "0.0000";
// //   return value.toFixed(decimals); // no fuerza a 0.0000 si es pequeño
// // }

// // // 14. SALIDA
// // const payload = {
// //   id: container.id,
// //   nivel_cm: formatValue(nivelFiltrado, 2),
// //   temperatura_c: T.toFixed(1),
// //   volumen_L: formatValue(Vadj, 2),
// //   caudal_Lps: prev.estado !== "reposo" ? formatValueCaudal(prev.Q, 4) : "0.000",
// //   ETA_segundos:
// //     prev.estado !== "reposo" ? Math.max(0, Math.round(prev.ETA)) : "0",
// //   estado: prev.estado,
// //   timestamp: msg.payload.timestamp || new Date(ts).toISOString(),
// // };

// // context.set("prev", prev);
// // msg.payload = payload;
// // return msg;
