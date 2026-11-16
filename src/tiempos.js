// Convierte milisegundos a un texto legible (ej: "2 h 15 min")
export function formatear(ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const dias = Math.floor(totalMin / 1440);
  const horas = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  if (dias > 0) return `${dias} d ${horas} h ${min} min`;
  if (horas > 0) return `${horas} h ${min} min`;
  return `${min} min`;
}

// Calcula los tiempos de un ticket
//   tiempo en pausa    = suma de (fin - inicio) de cada pausa
//   tiempo de solución = (cierre - creación) - tiempo en pausa
export function calcularTiempos(ticket) {
  if (!ticket.fechaCreacion) return null;
  const creacion = ticket.fechaCreacion.toMillis();
  const fin = ticket.fechaCierre ? ticket.fechaCierre.toMillis() : Date.now();

  let pausa = 0;
  for (const p of ticket.pausas || []) {
    const inicio = p.inicio.toMillis();
    const finPausa = p.fin ? p.fin.toMillis() : fin; // si la pausa sigue abierta, cuenta hasta ahora
    pausa += finPausa - inicio;
  }

  const solucion = fin - creacion - pausa;
  return { pausa, solucion };
}