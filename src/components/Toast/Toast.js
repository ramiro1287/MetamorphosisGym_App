import React from "react";
import { StyleSheet } from "react-native";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import {
  secondBackgroundDark, secondBackgroundLight,
  defaultTextDark, defaultTextLight,
  buttonTextConfirmDark, buttonTextConfirmLight,
  errorButtonTextDark, errorButtonTextLight,
  buttonBackgroundDark, buttonBackgroundLight,
} from "../../constants/UI/colors";

export const getToastConfig = (isDarkMode) => {
  const styles = StyleSheet.create({
    base: {
      borderLeftWidth: 5,
      borderRadius: 12,
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderWidth: 0.5,
      elevation: 0,
      shadowColor: "transparent", // para iOS
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    success: {
      borderColor: isDarkMode ? buttonTextConfirmDark : buttonTextConfirmLight,
    },
    error: {
      borderColor: isDarkMode ? errorButtonTextDark : errorButtonTextLight,
    },
    info: {
      borderColor: isDarkMode ? buttonBackgroundDark : buttonBackgroundLight,
    },
    content: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 2,
    },
    message: {
      fontSize: 16,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
  });

  return {
    success: (props) => (
      <BaseToast
        {...props}
        style={[styles.base, styles.success]}
        contentContainerStyle={styles.content}
        text1Style={styles.title}
        text2Style={styles.message}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={[styles.base, styles.error]}
        contentContainerStyle={styles.content}
        text1Style={styles.title}
        text2Style={styles.message}
      />
    ),
    info: (props) => (
      <BaseToast
        {...props}
        style={[styles.base, styles.info]}
        contentContainerStyle={styles.content}
        text1Style={styles.title}
        text2Style={styles.message}
      />
    ),
  };
};

const defaultOptions = {
  position: "bottom",
  visibilityTime: 3000,
};

export const showToast = (options = {}) => {
    Toast.show({
    ...defaultOptions,
    ...options,
 });
};

export const toastSuccess = (text1, text2) => showToast({ type: "success", text1, text2 });

export const toastError = (text1, text2) => showToast({ type: "error", text1, text2 });

export const toastInfo = (text1, text2) => showToast({ type: "info", text1, text2 });
