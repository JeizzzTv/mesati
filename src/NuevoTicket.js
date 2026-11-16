import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView } from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { CATEGORIAS } from "./constantes";
import Boton from "./Boton";

export default function NuevoTicket({ usuario, ficha, alTerminar, tema }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);

  const e = crearEstilos(tema);

  const guardar = async () => {
    if (titulo.trim() === "") {
      Alert.alert("Falta el título", "Escribe un título para el ticket.");
      return;
    }
    try {
      await addDoc(collection(db, "tickets"), {
        titulo: titulo,
        descripcion: descripcion,
        categoria: categoria,
        estado: "Abierto",
        creadoPor: usuario.uid,
        creadoPorNombre: ficha.nombre,
        tecnicoAsignado: null,
        fechaCreacion: serverTimestamp(), // la hora la pone el servidor de Firebase
        fechaCierre: null,
        pausas: [],
      });
      Alert.alert("Listo", "Ticket creado");
      alTerminar();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={e.etiqueta}>Título</Text>
      <TextInput
        style={e.input}
        placeholder="Ej: No conecta la VPN"
        placeholderTextColor={tema.textoSuave}
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={e.etiqueta}>Descripción</Text>
      <TextInput
        style={[e.input, { height: 100, textAlignVertical: "top" }]}
        placeholder="Describe el problema"
        placeholderTextColor={tema.textoSuave}
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={e.etiqueta}>Categoría</Text>
      <View style={e.fila}>
        {CATEGORIAS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[e.chip, categoria === c && { backgroundColor: tema.primario }]}
            onPress={() => setCategoria(c)}
          >
            <Text style={{ color: categoria === c ? tema.textoPrimario : tema.texto }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Boton texto="Crear ticket" onPress={guardar} tema={tema} />
    </ScrollView>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    etiqueta: { fontWeight: "bold", marginBottom: 6, color: t.texto },
    input: {
      borderWidth: 1,
      borderColor: t.borde,
      backgroundColor: t.input,
      color: t.texto,
      borderRadius: 8,
      padding: 12,
      marginBottom: 14,
    },
    fila: { flexDirection: "row", flexWrap: "wrap", marginBottom: 18 },
    chip: {
      borderWidth: 1,
      borderColor: t.primario,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
    },
  });