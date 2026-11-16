import { TouchableOpacity, Text } from "react-native";

export default function Boton({ texto, onPress, tema, secundario }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: secundario ? "transparent" : tema.primario,
        borderWidth: 1,
        borderColor: tema.primario,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ color: secundario ? tema.primario : tema.textoPrimario, fontWeight: "bold" }}>
        {texto}
      </Text>
    </TouchableOpacity>
  );
}