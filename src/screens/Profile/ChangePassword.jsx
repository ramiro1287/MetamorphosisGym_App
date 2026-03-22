import React, { useState, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Text,
} from "react-native";
import { Eye, EyeOff } from "react-native-feather";
import { GymContext } from "../../context/GymContext";
import TouchableButton from "../../components/Buttons/TouchableButton";
import FormContainer from "../../components/Containers/FormContainer";
import { fetchWithAuth } from "../../services/authService";
import { toastError, toastSuccess } from "../../components/Toast/Toast";
import { getThemeColors, getCommonStyles } from "../../constants/UI/theme";

export default function ChangePassword () {
  const [oldPassword, setOldPassword] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword2, setNewPassword2] = useState("");
  const [newPasswordError2, setNewPasswordError2] = useState("");
  const [showNewPassword2, setShowNewPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const handleChangePassword = async () => {
    let hasError = false;
    setOldPasswordError("");
    setNewPasswordError("");
    setNewPasswordError2("");

    if (!oldPassword.trim()) {
      setOldPasswordError("Ingresa tu contraseña actual");
      hasError = true;
    }

    if (!newPassword.trim()) {
      setNewPasswordError("Ingresa tu nueva contraseña");
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewPasswordError("La contraseña debe tener 6 caracteres");
      hasError = true;
    }

    if (!newPassword2.trim()) {
      setNewPasswordError2("Repita la contraseña");
      hasError = true;
    } else if (newPassword2.length < 6) {
      setNewPasswordError2("La contraseña debe tener 6 caracteres");
      hasError = true;
    }

    if (hasError) return;

    if (newPassword.trim() && newPassword2.trim() && newPassword !== newPassword2) {
      setNewPasswordError2("Las contraseñas nuevas no coinciden");
      hasError = true;
    }

    if (hasError) return;

    if (newPassword === oldPassword) {
      setOldPasswordError("La nueva contraseña es igual a la vieja contraseña");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth("/users/password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      if (response.ok) {
        toastSuccess("Contraseña actualizada");
        navigation.goBack();
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError(data.error_detail);
      } else {
        toastError("Error", "No se pudo cambiar tu contraseña");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    } finally {
      setLoading(false);
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    }
  };

  const styles = StyleSheet.create({
    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 25,
      color: t.text,
    },
    passwordInput: {
      flex: 1,
    },
  });

  return (
    <FormContainer>
      <Text style={styles.title}>Contraseña Actual</Text>
      <View style={common.passwordContainer}>
        <TextInput
          style={[common.input, oldPasswordError ? common.inputError : null, styles.passwordInput]}
          placeholder="Contraseña Actual"
          placeholderTextColor={t.text}
          value={oldPassword}
          onChangeText={(text) => {
            setOldPassword(text);
            setOldPasswordError("");
          }}
          secureTextEntry={!showOldPassword}
        />
        <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
          {showOldPassword ? (
            <Eye width={24} height={24} stroke={t.text} />
          ) : (
            <EyeOff width={24} height={24} stroke={t.text} />
          )}
        </TouchableOpacity>
      </View>
      {oldPasswordError ? <Text style={common.errorText}>{oldPasswordError}</Text> : null}

      <Text style={styles.title}>Nueva Contraseña</Text>
      <View style={common.passwordContainer}>
        <TextInput
          style={[common.input, newPasswordError ? common.inputError : null, styles.passwordInput]}
          placeholder="Nueva Contraseña"
          placeholderTextColor={t.text}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setNewPasswordError("");
          }}
          secureTextEntry={!showNewPassword}
        />
        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
          {showNewPassword ? (
            <Eye width={24} height={24} stroke={t.text} />
          ) : (
            <EyeOff width={24} height={24} stroke={t.text} />
          )}
        </TouchableOpacity>
      </View>
      {newPasswordError ? <Text style={common.errorText}>{newPasswordError}</Text> : null}

      <Text style={styles.title}>Repita Contraseña</Text>
      <View style={common.passwordContainer}>
        <TextInput
          style={[common.input, newPasswordError2 ? common.inputError : null, styles.passwordInput]}
          placeholder="Repita Contraseña"
          placeholderTextColor={t.text}
          value={newPassword2}
          onChangeText={(text) => {
            setNewPassword2(text);
            setNewPasswordError2("");
          }}
          secureTextEntry={!showNewPassword2}
        />
        <TouchableOpacity onPress={() => setShowNewPassword2(!showNewPassword2)}>
          {showNewPassword2 ? (
            <Eye width={24} height={24} stroke={t.text} />
          ) : (
            <EyeOff width={24} height={24} stroke={t.text} />
          )}
        </TouchableOpacity>
      </View>
      {newPasswordError2 ? <Text style={common.errorText}>{newPasswordError2}</Text> : null}
      <TouchableButton title="Cambiar Contraseña" onPress={handleChangePassword} loading={loading} />
    </FormContainer>
  );
};
