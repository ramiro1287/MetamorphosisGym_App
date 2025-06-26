import React, { useContext } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { GymContext } from "../../context/GymContext";
import {
  defaultButtonTextDark, defaultButtonTextLight,
  defaultTextDark, defaultTextLight,
} from "../../constants/UI/colors";

export default function LoadingScreen({ style = {} }) {
  const { isDarkMode } = useContext(GymContext);

  const styles = StyleSheet.create({
    rootContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
  });

  return (
    <View style={[styles.rootContainer, style]}>
      <ActivityIndicator
        size={80}
        color={isDarkMode ? defaultButtonTextLight : defaultButtonTextDark }
      />
      <Text style={styles.text}>Cargando...</Text>
    </View>
  );
}
