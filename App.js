import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./src/firebase";
import { temas } from "./src/tema";
import Boton from "./src/Boton";
import NuevoTicket from "./src/NuevoTicket";
import ListaTickets from "./src/ListaTickets";
import DetalleTicket from "./src/DetalleTicket";

export default function App() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [modoRegistro, setModoRegistro] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [ficha, setFicha] = useState(null); // nombre y rol guardados en Firestore
  const [pantalla, setPantalla] = useState("mis");
  const [ticketAbierto, setTicketAbierto] = useState(null); // id del ticket que se está viendo

  // ---- Modo día / noche ----
  const sistema = useColorScheme();
  const [modo, setModo] = useState(sistema === "dark" ? "oscuro" : "claro");
  const tema = temas[modo];
  const e = crearEstilos(tema);

  useEffect(() => {
    AsyncStorage.getItem("modoTema")
      .then((guardado) => {
        if (guardado === "claro" || guardado === "oscuro") setModo(guardado);
      })
      .catch(() => {});
  }, []);

  const cambiarModo = () => {
    const nuevo = modo === "claro" ? "oscuro" : "claro";
    setModo(nuevo);
    AsyncStorage.setItem("modoTema", nuevo).catch(() => {});
  };

  const textoBotonModo = modo === "claro" ? "🌙 Modo noche" : "☀️ Modo día";

  // ---- Sesión ----
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (u) => {
      setUsuario(u);
      if (!u) {
        setFicha(null);
        setPantalla("mis");
        setTicketAbierto(null);
        return;
      }
      const snap = await getDoc(doc(db, "usuarios", u.uid));
      if (snap.exists()) {
        const datos = snap.data();
        setFicha({ ...datos, nombre: datos.nombre || u.email });
      } else {
        setFicha({ nombre: u.email, correo: u.email, rol: "usuario" });
      }
    });
    return cancelar;
  }, []);

  const registrar = async () => {
    if (nombre.trim() === "") {
      Alert.alert("Falta el nombre", "Escribe tu nombre para registrarte.");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, clave);
      const datos = { nombre: nombre, correo: correo, rol: "usuario" };
      await setDoc(doc(db, "usuarios", cred.user.uid), datos);
      setFicha(datos);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const entrar = async () => {
    try {
      await signInWithEmailAndPassword(auth, correo, clave);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ---- Pantalla principal (con sesión iniciada) ----
  if (usuario) {
    if (!ficha) {
      return (
        <View style={e.centrado}>
          <Text style={{ textAlign: "center", color: tema.texto }}>Cargando...</Text>
        </View>
      );
    }
    return (
      <View style={[e.pantalla, { paddingTop: 50 }]}>
        <View style={e.barra}>
          <View>
            <Text style={e.nombre}>{ficha.nombre}</Text>
            <Text style={e.rol}>Rol: {ficha.rol}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={e.enlaceSimple} onPress={cambiarModo}>
              {textoBotonModo}
            </Text>
            <Text style={[e.enlaceSimple, { marginTop: 6 }]} onPress={() => signOut(auth)}>
              Salir
            </Text>
          </View>
        </View>

        {ticketAbierto ? (
          <DetalleTicket
            ticketId={ticketAbierto}
            usuario={usuario}
            ficha={ficha}
            tema={tema}
            alVolver={() => setTicketAbierto(null)}
          />
        ) : (
          <>
            <View style={e.tabs}>
              <Tab texto="Mis tickets" activo={pantalla === "mis"} onPress={() => setPantalla("mis")} tema={tema} />
              <Tab texto="Nuevo" activo={pantalla === "nuevo"} onPress={() => setPantalla("nuevo")} tema={tema} />
              {ficha.rol === "tecnico" && (
                <Tab
                  texto="Asignados"
                  activo={pantalla === "asignados"}
                  onPress={() => setPantalla("asignados")}
                  tema={tema}
                />
              )}
              {ficha.rol === "admin" && (
                <Tab texto="Todos" activo={pantalla === "todos"} onPress={() => setPantalla("todos")} tema={tema} />
              )}
            </View>

            {pantalla === "mis" && (
              <ListaTickets usuario={usuario} modo="mis" tema={tema} alAbrir={setTicketAbierto} />
            )}
            {pantalla === "nuevo" && (
              <NuevoTicket
                usuario={usuario}
                ficha={ficha}
                tema={tema}
                alTerminar={() => setPantalla("mis")}
              />
            )}
            {pantalla === "asignados" && (
              <ListaTickets usuario={usuario} modo="asignados" tema={tema} alAbrir={setTicketAbierto} />
            )}
            {pantalla === "todos" && (
              <ListaTickets usuario={usuario} modo="todos" tema={tema} alAbrir={setTicketAbierto} />
            )}
          </>
        )}
      </View>
    );
  }

  // ---- Login / Registro ----
  return (
    <View style={e.centrado}>
      <View style={{ position: "absolute", top: 50, right: 20 }}>
        <Text style={e.enlaceSimple} onPress={cambiarModo}>
          {textoBotonModo}
        </Text>
      </View>

      <Text style={e.titulo}>MesaTI</Text>
      <Text style={e.subtitulo}>{modoRegistro ? "Crear cuenta" : "Iniciar sesión"}</Text>

      {modoRegistro && (
        <TextInput
          style={e.input}
          placeholder="Nombre completo"
          placeholderTextColor={tema.textoSuave}
          value={nombre}
          onChangeText={setNombre}
        />
      )}
      <TextInput
        style={e.input}
        placeholder="Correo"
        placeholderTextColor={tema.textoSuave}
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput
        style={e.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor={tema.textoSuave}
        secureTextEntry
        value={clave}
        onChangeText={setClave}
      />

      <Boton
        texto={modoRegistro ? "Crear cuenta" : "Entrar"}
        onPress={modoRegistro ? registrar : entrar}
        tema={tema}
      />

      <Text style={e.enlace} onPress={() => setModoRegistro(!modoRegistro)}>
        {modoRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </Text>
    </View>
  );
}

function Tab({ texto, activo, onPress, tema }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: tema.primario,
        backgroundColor: activo ? tema.primario : "transparent",
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 14,
        marginRight: 8,
      }}
    >
      <Text style={{ color: activo ? tema.textoPrimario : tema.texto }}>{texto}</Text>
    </TouchableOpacity>
  );
}

const crearEstilos = (t) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: t.fondo },
    centrado: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: t.fondo },
    titulo: { fontSize: 30, fontWeight: "bold", textAlign: "center", color: t.texto },
    subtitulo: { fontSize: 18, textAlign: "center", marginBottom: 20, color: t.textoSuave },
    input: {
      borderWidth: 1,
      borderColor: t.borde,
      backgroundColor: t.input,
      color: t.texto,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    enlace: { marginTop: 18, textAlign: "center", color: t.primario, fontSize: 16 },
    enlaceSimple: { color: t.primario, fontWeight: "bold" },
    barra: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    nombre: { fontWeight: "bold", fontSize: 16, color: t.texto },
    rol: { color: t.textoSuave },
    tabs: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 8 },
  });