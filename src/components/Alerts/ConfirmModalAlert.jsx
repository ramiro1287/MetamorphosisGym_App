import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated
} from "react-native";
import { GymContext } from "../../context/GymContext";
import {
  buttonTextConfirmDark, buttonTextConfirmLight,
  buttonTextCancelDark, buttonTextCancelLight,
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonBorderDark, buttonBorderLight,
} from "../../constants/UI/colors";

/*
const confirm = await showConfirmModalAlert("¿Estás seguro de logear?");
if (!confirm) return;
*/

export default function ConfirmModalAlert({
  visible, message, onConfirm, onCancel,
  cancelMsg = "Cancelar", confirmMsg = "Confirmar"
}) {
  const { isDarkMode } = useContext(GymContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    dialogBox: {
      width: "80%",
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 12,
      paddingTop: 20,
    },
    message: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 17,
      textAlign: "center",
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: 5,
    },
    cancelButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderTopWidth: 0.5,
      borderRightWidth: 0.5,
      borderColor: isDarkMode ? buttonBorderDark : buttonBorderLight,
      borderBottomLeftRadius: 12,
    },
    confirmButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderTopWidth: 0.5,
      borderLeftWidth: 0.5,
      borderColor: isDarkMode ? buttonBorderDark : buttonBorderLight,
      borderBottomRightRadius: 12,
    },
    cancelText: {
      color: isDarkMode ? buttonTextCancelDark : buttonTextCancelLight,
      fontWeight: "bold",
    },
    confirmText: {
      color: isDarkMode ? buttonTextConfirmDark : buttonTextConfirmLight,
      fontWeight: "bold",
    }
  });

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.dialogBox, { opacity: fadeAnim }]}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelMsg}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmMsg}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

let setDialogState;

export function ConfirmModalProvider({ children }) {
  const [dialog, setDialog] = useState({
    visible: false,
    message: "",
    resolve: null,
  });

  setDialogState = setDialog;

  return (
    <View style={{ flex: 1 }}>
      {children}
      <ConfirmModalAlert
        visible={dialog.visible}
        message={dialog.message}
        cancelMsg={dialog.cancelMsg}
        confirmMsg={dialog.confirmMsg}
        onConfirm={() => {
          dialog.resolve(true);
          setDialog({ ...dialog, visible: false });
        }}
        onCancel={() => {
          dialog.resolve(false);
          setDialog({ ...dialog, visible: false });
        }}
      />
    </View>
  );
}

export function showConfirmModalAlert(
  message, cancelMsg = "Cancelar", confirmMsg = "Continuar"
) {
  return new Promise((resolve) => {
    setDialogState({
      visible: true,
      message,
      cancelMsg,
      confirmMsg,
      resolve,
    });
  });
}
