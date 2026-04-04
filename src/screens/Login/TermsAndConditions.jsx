import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from "react-native";
import { GymContext } from "../../context/GymContext";
import { fetchWithAuth } from "../../services/authService";
import { BaseServerUrl } from "../../constants/environment";
import { getThemeColors } from "../../constants/UI/theme";
import TouchableButton from "../../components/Buttons/TouchableButton";
import FormContainer from "../../components/Containers/FormContainer";
import { toastError } from "../../components/Toast/Toast";
import { Check } from "react-native-feather";

export default function TermsAndConditions() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { refreshUser, handleLogout, isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const response = await fetchWithAuth("/users/accept-terms/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await refreshUser();
      } else {
        toastError("Error", "No se pudieron aceptar los términos");
      }
    } catch {
      toastError("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    await handleLogout();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    title: {
      fontSize: 25,
      fontWeight: "bold",
      color: t.text,
    },
    description: {
      fontSize: 15,
      color: t.secondText,
      textAlign: "center",
      marginBottom: 30,
      paddingHorizontal: 25,
      fontWeight: "500",
    },
    link: {
      textDecorationLine: "underline",
      fontSize: 18,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 30,
      paddingHorizontal: 25,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: t.buttonBorder,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    checkboxChecked: {
      backgroundColor: t.buttonBackground,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 15,
      color: t.text,
    },
    buttonsContainer: {
        flexDirection: "row",
      gap: 12,
    },
  });

  return (
    <View style={styles.container}>
      <FormContainer>
        {isDarkMode ? (
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 300, height: 300, marginTop: 60, marginBottom: 30 }}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={require("../../assets/logo_color.png")}
            style={{ width: 300, height: 300, marginTop: 60, marginBottom: 30 }}
            resizeMode="contain"
          />
        )}
        <Text style={styles.title}>Términos y Condiciones</Text>

        <Text style={styles.description}>
          Para continuar usando la aplicación, debés aceptar nuestros{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(`${BaseServerUrl}/static/docs/MetamorphosisGym_TyCs.pdf`)}
          >
            Términos & Condiciones
          </Text>
          {" "}y{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(`${BaseServerUrl}/static/docs/MetamorphosisGym_TyCs.pdf`)}
          >
            Políticas de Privacidad
          </Text>.
        </Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.7}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Check width={18} height={18} stroke={isDarkMode ? "#000" : "#FFF"} />}
          </View>
          <Text style={styles.checkboxLabel}>
            Acepto los Términos & Condiciones y Políticas de Privacidad
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonsContainer}>
          <TouchableButton
            title="Aceptar"
            onPress={handleAccept}
            loading={loading}
            disabled={!accepted}
          />
          <TouchableButton
            title="No Aceptar"
            onPress={handleReject}
            variant="error"
          />
        </View>
      </FormContainer>
    </View>
  );
}
