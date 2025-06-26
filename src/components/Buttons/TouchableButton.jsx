import React, { useContext } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { GymContext } from "../../context/GymContext";
import {
  buttonBackgroundDark, buttonBackgroundLight,
  defaultButtonTextDark, defaultButtonTextLight,
  errorButtonTextDark, errorButtonTextLight,
} from "../../constants/UI/colors";

export default function TouchableButton({
  title,
  onPress,
  icon = null,
  variant = "default",
  style = {},
  loading = false,
  disabled = false,
  textButtonStyle = {},
}) {
  const { isDarkMode } = useContext(GymContext);

  const styles = StyleSheet.create({
    button: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    defaultButton: {
      backgroundColor: isDarkMode ? buttonBackgroundDark : buttonBackgroundLight,
    },
    errorButton: {
      backgroundColor: isDarkMode ? errorButtonTextDark : errorButtonTextLight,
    },
    buttonText: {
      color: isDarkMode ? defaultButtonTextDark : defaultButtonTextLight,
      fontSize: 18,
      fontWeight: "bold",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    iconWrapper: {
      marginRight: 8,
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "error" ? styles.errorButton : styles.defaultButton,
        style,
        disabled && styles.buttonDisabled,
      ]}
      onPress={!loading ? onPress : null}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isDarkMode ? defaultButtonTextDark : defaultButtonTextLight}
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[styles.buttonText, textButtonStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
