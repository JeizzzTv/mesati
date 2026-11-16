import { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./src/firebase";

export default function App() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [modoRegistro, setModoRegistro] = useState(false); // false = login, true = registro
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (u) => setUsuario(u));
    return cancelar;
  }, []);

  const registrar = async () => {
    if (nombre.trim() === "") {
      Alert.alert("Falta el nombre", "Escribe tu nombre para registrarte.");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, clave);
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre: nombre,
        correo: correo,
        rol: "usuario",
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const entrar = async () => {
    try {
      await signInWithEmailAndPassword(auth, correo, clave);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  if (usuario) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Bienvenido</Text>
        <Text style={{ textAlign: "center", marginBottom: 20 }}>{usuario.email}</Text>
        <Button title="Cerrar sesión" onPress={() => signOut(auth)} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>MesaTI</Text>
      <Text style={estilos.subtitulo}>
        {modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
      </Text>

      {modoRegistro && (
        <TextInput
          style={estilos.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />
      )}
      <TextInput
        style={estilos.input}
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput
        style={estilos.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        secureTextEntry
        value={clave}
        onChangeText={setClave}
      />

      <Button
        title={modoRegistro ? "Crear cuenta" : "Entrar"}
        onPress={modoRegistro ? registrar : entrar}
      />

      <Text style={estilos.enlace} onPress={() => setModoRegistro(!modoRegistro)}>
        {modoRegistro
          ? "¿Ya tienes cuenta? Inicia sesión"
          : "¿No tienes cuenta? Regístrate"}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: "center", padding: 24 },
  titulo: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitulo: { fontSize: 18, textAlign: "center", marginBottom: 20, color: "#555" },
  input: { borderWidth: 1, borderColor: "#999", borderRadius: 6, padding: 10, marginBottom: 12 },
  enlace: { marginTop: 18, textAlign: "center", color: "#0066cc", fontSize: 16 },
});