import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { coloresEstado } from "./tema";

export default function ListaTickets({ usuario, modo, tema, alAbrir }) {
  const [tickets, setTickets] = useState([]);
  const e = crearEstilos(tema);

  useEffect(() => {
    const ref = collection(db, "tickets");
    let consulta = ref; // modo "todos": sin filtro
    if (modo === "mis") consulta = query(ref, where("creadoPor", "==", usuario.uid));
    if (modo === "asignados") consulta = query(ref, where("tecnicoAsignado", "==", usuario.uid));

    const cancelar = onSnapshot(
      consulta,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        lista.sort(
          (a, b) => (b.fechaCreacion?.seconds ?? 9999999999) - (a.fechaCreacion?.seconds ?? 9999999999)
        );
        setTickets(lista);
      },
      (error) => console.log(error)
    );
    return cancelar;
  }, [modo]);

  const total = tickets.length;
  const cerrados = tickets.filter((t) => t.estado === "Cerrado").length;
  const abiertos = total - cerrados; // abierto = todo lo que no está cerrado

  return (
    <View style={{ flex: 1 }}>
      <View style={e.resumen}>
        <Caja numero={total} texto="Total" e={e} />
        <Caja numero={abiertos} texto="Abiertos" e={e} />
        <Caja numero={cerrados} texto="Cerrados" e={e} />
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 30, color: tema.textoSuave }}>
            No hay tickets todavía
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={e.tarjeta} onPress={() => alAbrir(item.id)}>
            <View style={e.filaTitulo}>
              <Text style={e.titulo}>{item.titulo}</Text>
              <View style={[e.etiquetaEstado, { backgroundColor: coloresEstado[item.estado] || "#6b7280" }]}>
                <Text style={e.textoEstado}>{item.estado}</Text>
              </View>
            </View>
            <Text style={e.dato}>Categoría: {item.categoria}</Text>
            {modo === "todos" ? <Text style={e.dato}>Creado por: {item.creadoPorNombre}</Text> : null}
            {item.tecnicoNombre ? <Text style={e.dato}>Técnico: {item.tecnicoNombre}</Text> : null}
            <Text style={e.fecha}>
              {item.fechaCreacion ? item.fechaCreacion.toDate().toLocaleString() : "Guardando..."}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Caja({ numero, texto, e }) {
  return (
    <View style={e.caja}>
      <Text style={e.numero}>{numero}</Text>
      <Text style={e.textoCaja}>{texto}</Text>
    </View>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    resumen: { flexDirection: "row", justifyContent: "space-around", padding: 12 },
    caja: { alignItems: "center", backgroundColor: t.caja, borderRadius: 10, paddingVertical: 10, width: 105 },
    numero: { fontSize: 26, fontWeight: "bold", color: t.primario },
    textoCaja: { color: t.texto },
    tarjeta: {
      backgroundColor: t.tarjeta,
      borderWidth: 1,
      borderColor: t.borde,
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 10,
    },
    filaTitulo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    titulo: { fontSize: 16, fontWeight: "bold", color: t.texto, flex: 1, marginRight: 8 },
    etiquetaEstado: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
    textoEstado: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
    dato: { color: t.texto },
    fecha: { color: t.textoSuave, marginTop: 4, fontSize: 12 },
  });