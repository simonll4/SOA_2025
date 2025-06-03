// 1. Obtener configuración del contenedor
const container = global.get("container");
if (!container?.thresholds) {
  node.error("No se encontraron umbrales en el container");
  return null;
}

// 2. Calcular umbrales absolutos (solo una vez)
let ctx = context.get("nivelContext") || {};
if (!ctx.umbrales) {
  ctx.umbrales = {
    bajo_bajo: container.height * container.thresholds.low_low,
    bajo: container.height * container.thresholds.low,
    alto: container.height * container.thresholds.high,
    alto_alto: container.height * container.thresholds.high_high,
  };
}

// 3. Obtener y validar medición actual
let nivel = msg.payload.nivel_cm;

if (typeof nivel !== "number") {
  nivel = parseFloat(nivel);
  if (isNaN(nivel)) {
    node.error("El valor de nivel no es un número válido", msg);
    return null;
  }
}

const lastAlarm = ctx.lastAlarm || null;
const um = ctx.umbrales;

// 4. Determinar estado actual
let estadoActual = "Normal";
if (nivel <= um.bajo_bajo) estadoActual = "Bajo-Bajo";
else if (nivel <= um.bajo) estadoActual = "Bajo";
else if (nivel >= um.alto_alto) estadoActual = "Alto-Alto";
else if (nivel >= um.alto) estadoActual = "Alto";

// 5. Determinar dirección del cambio (carga o descarga)
let tendencia = null;
if (ctx.ultimoNivel !== undefined) {
  if (nivel > ctx.ultimoNivel) tendencia = "carga";
  else if (nivel < ctx.ultimoNivel) tendencia = "descarga";
}

// 6. Lógica de notificación
let notificar = false;
let mensaje = "";

if (estadoActual !== lastAlarm) {
  // Cambió de estado
  if (estadoActual === "Normal" && lastAlarm !== null) {
    // Volvió a normal
    notificar = true;
    mensaje = `ALARMA RESUELTA: ${lastAlarm} -> Normal (${nivel.toFixed(
      2
    )} cm)`;
    ctx.lastAlarm = null;
  } else if (estadoActual !== "Normal") {
    // Está en estado de alarma
    if (lastAlarm === null) {
      // Primera alarma
      notificar = true;
      mensaje = `ALARMA ${estadoActual}: Nivel ${nivel.toFixed(2)} cm`;
      ctx.lastAlarm = estadoActual;
    } else if (tendencia === "descarga") {
      // En descarga, siempre reportar cambio a estado más crítico o menos crítico
      notificar = true;
      mensaje = `ALARMA ${estadoActual}: Nivel ${nivel.toFixed(2)} cm`;
      ctx.lastAlarm = estadoActual;
    } else if (tendencia === "carga") {
      // En carga, solo reportar si se pasa a un estado más crítico (de B a BB por ejemplo)
      const niveles = ["Normal", "Bajo", "Bajo-Bajo", "Alto", "Alto-Alto"];
      const severidad = (e) => niveles.indexOf(e);
      if (severidad(estadoActual) > severidad(lastAlarm)) {
        notificar = true;
        mensaje = `ALARMA ${estadoActual}: Nivel ${nivel.toFixed(2)} cm`;
        ctx.lastAlarm = estadoActual;
      } // Si baja severidad en carga, no notificar
    }
  }
}

// 7. Guardar contexto y preparar salida
ctx.ultimoNivel = nivel;
context.set("nivelContext", ctx);

msg.payload = {
  nivel: nivel,
  estado_actual: estadoActual,
  estado_anterior: lastAlarm,
  requiere_notificacion: notificar,
  mensaje: mensaje,
  umbrales: um, // Para depuración
  tendencia: tendencia || "sin cambios",
};

return msg;

// // 1. Obtener configuración del contenedor
// const container = global.get("container");
// if (!container?.thresholds) {
//   node.error("No se encontraron umbrales en el container");
//   return null;
// }

// // 2. Calcular umbrales absolutos (solo una vez)
// let ctx = context.get("nivelContext") || {};
// if (!ctx.umbrales) {
//   ctx.umbrales = {
//     bajo_bajo: container.height * container.thresholds.low_low,
//     bajo: container.height * container.thresholds.low,
//     alto: container.height * container.thresholds.high,
//     alto_alto: container.height * container.thresholds.high_high,
//   };
//   context.set("nivelContext", ctx);
// }

// // 3. Obtener y validar medición actual
// let nivel = msg.payload.nivel_cm; // Cambiado de distance_cm a nivel_cm según tu código

// // Asegurarnos que nivel es un número
// if (typeof nivel !== "number") {
//   nivel = parseFloat(nivel);
//   if (isNaN(nivel)) {
//     node.error("El valor de nivel no es un número válido", msg);
//     return null;
//   }
// }

// const lastAlarm = ctx.lastAlarm || null;

// // 4. Determinar estado actual
// let estadoActual = "Normal";
// if (nivel <= ctx.umbrales.bajo_bajo) estadoActual = "Bajo-Bajo";
// else if (nivel <= ctx.umbrales.bajo) estadoActual = "Bajo";
// else if (nivel >= ctx.umbrales.alto_alto) estadoActual = "Alto-Alto";
// else if (nivel >= ctx.umbrales.alto) estadoActual = "Alto";

// // 5. Lógica de detección de cambios
// let notificar = false;
// let mensaje = "";

// if (estadoActual !== "Normal" && estadoActual !== lastAlarm) {
//   // Nueva alarma
//   notificar = true;
//   mensaje = `ALARMA ${estadoActual}: Nivel ${nivel.toFixed(2)} cm`;
//   ctx.lastAlarm = estadoActual;
// } else if (estadoActual === "Normal" && lastAlarm) {
//   // Recuperación
//   notificar = true;
//   mensaje = `ALARMA RESUELTA: ${lastAlarm} -> Normal (${nivel.toFixed(2)} cm)`;
//   ctx.lastAlarm = null;
// }

// // 6. Guardar contexto y preparar salida
// context.set("nivelContext", ctx);
// msg.payload = {
//   nivel: nivel,
//   estado_actual: estadoActual,
//   estado_anterior: lastAlarm,
//   requiere_notificacion: notificar,
//   mensaje: mensaje,
//   umbrales: ctx.umbrales, // Para debug
// };

// return msg;
