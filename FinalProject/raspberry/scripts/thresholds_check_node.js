// 1. Obtener container y calcular umbrales (solo una vez)
const container = global.get("container");
if (!container?.thresholds) {
  node.error("No se encontraron umbrales en el container");
  return null;
}

// 2. Calcular umbrales absolutos y guardar en contexto (si no existen)
const ctx = context.get() || {};
if (!ctx.umbrales) {
  ctx.umbrales = {
    bajo_bajo: container.height * container.thresholds.low_low,
    bajo: container.height * container.thresholds.low,
    alto: container.height * container.thresholds.high,
    alto_alto: container.height * container.thresholds.high_high,
  };
  context.set(ctx);
}

// 3. Obtener nivel actual y último estado de alarma
const nivel = msg.payload.distance_cm;
const lastAlarm = ctx.lastAlarm || null;

// 4. Determinar alarma actual (o null si está en rango normal)
let alarma = null;
if (nivel <= ctx.umbrales.bajo_bajo) {
  alarma = "Bajo-Bajo";
} else if (nivel <= ctx.umbrales.bajo) {
  alarma = "Bajo";
} else if (nivel >= ctx.umbrales.alto_alto) {
  alarma = "Alto-Alto";
} else if (nivel >= ctx.umbrales.alto) {
  alarma = "Alto";
}

// 5. Lógica para notificar cambios
let notificar = false;
let mensaje = "";

// Caso 1: Nueva alarma detectada
if (alarma && alarma !== lastAlarm) {
  notificar = true;
  mensaje = `Alarma ${alarma}: Nivel ${nivel.toFixed(2)} cm`;
  ctx.lastAlarm = alarma; // Actualizar estado

  // Caso 2: Recuperación (vuelta a rango normal)
} else if (!alarma && lastAlarm) {
  notificar = true;
  mensaje = `Alarma ${lastAlarm} resuelta: Nivel ${nivel.toFixed(2)} cm`;
  ctx.lastAlarm = null; // Resetear estado
}

// 6. Guardar contexto y preparar salida
context.set(ctx);
msg.payload = {
  ...msg.payload,
  alarma_actual: alarma,
  alarma_anterior: lastAlarm,
  notificar: notificar,
  mensaje: notificar ? mensaje : null,
  umbrales: ctx.umbrales, // Opcional para debug
};

return msg;
