import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView } from "react-native";
import { doc, onSnapshot, updateDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { CATEGORIAS } from "./constantes";
import { coloresEstado } from "./tema";
import { formatear, calcularTiempos } from "./tiempos";
import Boton from "./Boton";

export default function DetalleTicket({ ticketId, usuario, ficha, tema, alVolver }) {
  const [ticket, setTicket] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [motivo, setMotivo] = useState("");
  const e = crearEstilos(tema);
  const esAdmin = ficha.rol === "admin";

  // Escucha el ticket: si algo cambia en la nube, la pantalla se actualiza sola
  useEffect(() => {
    const cancelar = onSnapshot(doc(db, "tickets", ticketId), (snap) => {
      if (snap.exists()) setTicket({ id: snap.id, ...snap.data() });
    });
    return cancelar;
  }, [ticketId]);

  // El admin necesita la lista de técnicos para asignar
  useEffect(() => {
    if (!esAdmin) return;
    getDocs(query(collection(db, "usuarios"), where("rol", "==", "tecnico")))
      .then((snap) => setTecnicos(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))))
      .catch((err) => console.log(err));
  }, []);

  if (!ticket) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ color: tema.texto }}>Cargando...</Text>
      </View>
    );
  }

  const esSuTicket = ficha.rol === "tecnico" && ticket.tecnicoAsignado === usuario.uid;
  const puedeGestionar = esAdmin || esSuTicket;
  const tiempos = calcularTiempos(ticket);

  // ---- Acciones ----
  const actualizar = async (cambios) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), cambios);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const reclasificar = (cat) => actualizar({ categoria: cat });

  const asignar = (t) => actualizar({ tecnicoAsignado: t.uid, tecnicoNombre: t.nombre || t.correo });

  const iniciar = () => actualizar({ estado: "En proceso" });

  const pausar = () => {
    if (motivo.trim() === "") {
      Alert.alert("Falta el motivo", "Escribe por qué se pausa (ej: esperando repuesto del proveedor).");
      return;
    }
    const nuevaPausa = { inicio: Timestamp.now(), fin: null, motivo: motivo };
    actualizar({ estado: "En pausa", pausas: [...(ticket.pausas || []), nuevaPausa] });
    setMotivo("");
  };

  const reanudar = () => {
    const ahora = Timestamp.now();
    const pausas = (ticket.pausas || []).map((p) => (p.fin === null ? { ...p, fin: ahora } : p));
    actualizar({ estado: "En proceso", pausas: pausas });
  };

  const cerrar = () => {
    Alert.alert("Cerrar ticket", "¿Confirmas que el caso quedó resuelto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar",
        onPress: () => {
          const ahora = Timestamp.now();
          // Si estaba en pausa, la pausa termina al cerrar
          const pausas = (ticket.pausas || []).map((p) => (p.fin === null ? { ...p, fin: ahora } : p));
          actualizar({ estado: "Cerrado", fechaCierre: ahora, pausas: pausas });
        },
      },
    ]);
  };

  const fecha = (ts) => (ts ? ts.toDate().toLocaleString() : "-");

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={e.volver} onPress={alVolver}>
        ← Volver
      </Text>

      <View style={e.filaTitulo}>
        <Text style={e.titulo}>{ticket.titulo}</Text>
        <View style={[e.etiquetaEstado, { backgroundColor: coloresEstado[ticket.estado] || "#6b7280" }]}>
          <Text style={e.textoEstado}>{ticket.estado}</Text>
        </View>
      </View>

      <Text style={e.dato}>{ticket.descripcion || "Sin descripción"}</Text>

      <View style={e.bloque}>
        <Text style={e.subtitulo}>Información</Text>
        <Text style={e.dato}>Categoría: {ticket.categoria}</Text>
        <Text style={e.dato}>Creado por: {ticket.creadoPorNombre}</Text>
        <Text style={e.dato}>Técnico: {ticket.tecnicoNombre || "Sin asignar"}</Text>
      </View>

      <View style={e.bloque}>
        <Text style={e.subtitulo}>Tiempos</Text>
        <Text style={e.dato}>Creación: {fecha(ticket.fechaCreacion)}</Text>
        <Text style={e.dato}>Tiempo en pausa: {tiempos ? formatear(tiempos.pausa) : "-"}</Text>
        <Text style={e.dato}>
          {ticket.estado === "Cerrado" ? "Tiempo de solución" : "Tiempo de trabajo hasta ahora"}:{" "}
          {tiempos ? formatear(tiempos.solucion) : "-"}
        </Text>
        {ticket.fechaCierre ? <Text style={e.dato}>Cierre: {fecha(ticket.fechaCierre)}</Text> : null}
      </View>

      {(ticket.pausas || []).length > 0 && (
        <View style={e.bloque}>
          <Text style={e.subtitulo}>Historial de pausas</Text>
          {ticket.pausas.map((p, i) => (
            <Text key={i} style={e.dato}>
              • {p.motivo} ({p.fin ? formatear(p.fin.toMillis() - p.inicio.toMillis()) : "en curso"})
            </Text>
          ))}
        </View>
      )}

      {/* ---- Acciones del administrador ---- */}
      {esAdmin && (
        <View style={e.bloque}>
          <Text style={e.subtitulo}>Administrador: reclasificar</Text>
          <View style={e.fila}>
            {CATEGORIAS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[e.chip, ticket.categoria === c && { backgroundColor: tema.primario }]}
                onPress={() => reclasificar(c)}
              >
                <Text style={{ color: ticket.categoria === c ? tema.textoPrimario : tema.texto }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[e.subtitulo, { marginTop: 8 }]}>Administrador: asignar técnico</Text>
          {tecnicos.length === 0 ? (
            <Text style={e.dato}>No hay técnicos. Cambia el rol de un usuario a "tecnico" en Firestore.</Text>
          ) : (
            <View style={e.fila}>
              {tecnicos.map((t) => (
                <TouchableOpacity
                  key={t.uid}
                  style={[e.chip, ticket.tecnicoAsignado === t.uid && { backgroundColor: tema.primario }]}
                  onPress={() => asignar(t)}
                >
                  <Text style={{ color: ticket.tecnicoAsignado === t.uid ? tema.textoPrimario : tema.texto }}>
                    {t.nombre || t.correo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ---- Acciones del técnico (o del admin) ---- */}
      {puedeGestionar && ticket.estado !== "Cerrado" && (
        <View style={e.bloque}>
          <Text style={e.subtitulo}>Gestionar ticket</Text>

          {ticket.estado === "Abierto" && <Boton texto="Iniciar atención" onPress={iniciar} tema={tema} />}

          {ticket.estado === "En proceso" && (
            <View>
              <TextInput
                style={e.input}
                placeholder="Motivo de la pausa (ej: esperando repuesto)"
                placeholderTextColor={tema.textoSuave}
                value={motivo}
                onChangeText={setMotivo}
              />
              <Boton texto="Pausar" onPress={pausar} tema={tema} secundario />
            </View>
          )}

          {ticket.estado === "En pausa" && <Boton texto="Reanudar" onPress={reanudar} tema={tema} />}

          {ticket.estado !== "Abierto" && (
            <View style={{ marginTop: 10 }}>
              <Boton texto="Cerrar ticket" onPress={cerrar} tema={tema} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    volver: { color: t.primario, fontWeight: "bold", marginBottom: 12, fontSize: 16 },
    filaTitulo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    titulo: { fontSize: 20, fontWeight: "bold", color: t.texto, flex: 1, marginRight: 8 },
    etiquetaEstado: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12 },
    textoEstado: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
    bloque: {
      backgroundColor: t.tarjeta,
      borderWidth: 1,
      borderColor: t.borde,
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
    },
    subtitulo: { fontWeight: "bold", color: t.texto, marginBottom: 6 },
    dato: { color: t.texto, marginBottom: 3 },
    fila: { flexDirection: "row", flexWrap: "wrap" },
    chip: {
      borderWidth: 1,
      borderColor: t.primario,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: t.borde,
      backgroundColor: t.input,
      color: t.texto,
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
    },
  });