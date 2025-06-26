import React, { useState, useContext } from "react";
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Image
} from "react-native";
import { saveToken } from "../../services/authService";
import { BaseServerUrl } from "../../constants/environment";
import { Eye, EyeOff } from "react-native-feather";
import TouchableButton from "../../components/Buttons/TouchableButton";
import FormContainer from "../../components/Containers/FormContainer";
import { GymContext } from "../../context/GymContext";
import { toastError } from "../../components/Toast/Toast";
import {
  inputErrorDark, inputErrorLight,
  defaultTextDark, defaultTextLight,
  mainBackgroundDark, mainBackgroundLight,
} from "../../constants/UI/colors";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { refreshUser, isDarkMode } = useContext(GymContext);

  const handleLogin = async () => {
    let hasError = false;
    setUsernameError("");
    setPasswordError("");

    if (!username.trim()) {
      setUsernameError("Ingresa tu DNI");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Ingresa tu contraseña");
      hasError = true;
    }

    if (!/\d+/.test(username)) {
      setUsernameError("El DNI debe ser un número válido");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const response = await fetch(`${BaseServerUrl}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { access, refresh } = await response.json();
        await saveToken(access, refresh);
        await refreshUser();
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError(data.error_detail);
      } else {
        toastError("Error", "Error al iniciar sesión");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const iconStroke = isDarkMode ? defaultTextDark : defaultTextLight;
  const styles = StyleSheet.create({
    title: {
      fontSize: 25,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    input: {
      height: 40,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
      paddingHorizontal: 8,
      width: "80%",
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "80%",
      marginBottom: 10,
    },
    passwordInput: {
      flex: 1,
    },
    inputError: {
      borderColor: isDarkMode ? inputErrorDark : inputErrorLight,
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? mainBackgroundDark : mainBackgroundLight }}>
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
        <Text style={styles.title}>Iniciar sesión</Text>
        <TextInput
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="DNI"
          placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameError("");
          }}
          keyboardType="numeric"
        />
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null, styles.passwordInput]}
            placeholder="Contraseña"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <Eye width={24} height={24} stroke={iconStroke} />
            ) : (
              <EyeOff width={24} height={24} stroke={iconStroke} />
            )}
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        <TouchableButton title="Ingresar" onPress={handleLogin} loading={loading} />

        <Text
          style={{
            color: isDarkMode ? defaultTextDark : defaultTextLight,
            marginTop: 20,
            marginBottom: 15,
            fontSize: 15,
            textAlign: "center",
            paddingHorizontal: 25,
            fontWeight: "500",
          }}
        >
          Al usar esta aplicación, aceptás nuestros{" "}
          <Text
            style={{ textDecorationLine: "underline", fontSize: 18 }}
            onPress={() => Linking.openURL(`${BaseServerUrl}/static/docs/MetamorphosisGym_TyCs.pdf`)}
          >
            Términos & Condiciones
          </Text>
          {" "}y{" "}
          <Text
            style={{ textDecorationLine: "underline", fontSize: 18 }}
            onPress={() => Linking.openURL(`${BaseServerUrl}/static/docs/MetamorphosisGym_TyCs.pdf`)}
          >
            Políticas de Privacidad
          </Text>.
        </Text>

      </FormContainer>
    </View>
  );
}
