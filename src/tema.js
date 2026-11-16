// Aquí viven TODOS los colores. Si quieres cambiar el aspecto, solo tocas este archivo.
export const temas = {
  claro: {
    fondo: "#f3f4f6",      // fondo de la pantalla
    tarjeta: "#ffffff",    // fondo de cada ticket
    texto: "#111827",      // texto principal
    textoSuave: "#6b7280", // texto secundario
    borde: "#d1d5db",
    primario: "#2563eb",   // azul de botones y pestañas activas
    textoPrimario: "#ffffff",
    input: "#ffffff",
    caja: "#dbeafe",       // cajas de conteos
  },
  oscuro: {
    fondo: "#0f172a",
    tarjeta: "#1e293b",
    texto: "#f1f5f9",
    textoSuave: "#94a3b8",
    borde: "#475569",
    primario: "#3b82f6",
    textoPrimario: "#ffffff",
    input: "#1e293b",
    caja: "#1e3a5f",
  },
};

// Cada estado tiene su color para identificarlo de un vistazo (sirve en día y noche)
export const coloresEstado = {
  Abierto: "#2563eb",     // azul
  "En proceso": "#d97706", // naranja
  "En pausa": "#7c3aed",   // morado
  Cerrado: "#16a34a",      // verde
};