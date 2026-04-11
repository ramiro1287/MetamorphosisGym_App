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
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    defaultButton: {
      backgroundColor: isDarkMode ? buttonBackgroundDark : buttonBackgroundLight,
    },
    errorButton: {
      backgroundColor: isDarkMode ? errorButtonTextDark : errorButtonTextLight,
    },
    buttonText: {
      color: isDarkMode ? defaultButtonTextDark : defaultButtonTextLight,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.3,
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
      activeOpacity={0.7}
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
