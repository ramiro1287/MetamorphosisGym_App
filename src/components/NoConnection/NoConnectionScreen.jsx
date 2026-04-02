import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import TouchableButton from "../Buttons/TouchableButton";
import { GymContext } from "../../context/GymContext";
import { getThemeColors } from "../../constants/UI/theme";

export default function NoConnectionScreen({ onRetry }) {
  const { isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
      gap: 15,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: t.text,
    },
    message: {
      fontSize: 16,
      color: t.secondText,
      textAlign: "center",
    },
    buttonContainer: {
      marginTop: 10,
      width: "60%",
    },
  });

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={80} color={t.secondText} />
      <Text style={styles.title}>Sin conexión</Text>
      <Text style={styles.message}>
        No se pudo conectar al servidor. Verificá tu conexión a internet e intentá de nuevo.
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableButton title="Reintentar" onPress={onRetry} />
      </View>
    </View>
  );
}
