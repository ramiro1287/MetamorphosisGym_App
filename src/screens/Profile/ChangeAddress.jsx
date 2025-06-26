import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import TouchableButton from "../../components/Buttons/TouchableButton";
import { GymContext } from "../../context/GymContext";
import { fetchWithAuth } from "../../services/authService";
import { toastError, toastSuccess } from "../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../components/Alerts/ConfirmModalAlert";
import FormContainer from "../../components/Containers/FormContainer";
import RNPickerSelect from "react-native-picker-select";
import {
  defaultTextDark, defaultTextLight,
  inputErrorDark, inputErrorLight,
} from "../../constants/UI/colors";

export default function ChangeAddress() {
  const [state, setState] = useState("AR-X");
  const [city, setCity] = useState("Cruz Del Eje");
  const [cityError, setCityError] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isDarkMode, gymInfo, refreshUser } = useContext(GymContext);
  const navigation = useNavigation();

  const handleChangeAddress = async () => {
    let hasError = false;
    setCityError("");
    setAddressError("");

    if (!city.trim()) {
      setCityError("Ingresa tu ciudad");
      hasError = true;
    }

    if (!address.trim()) {
      setAddressError("Ingresa tu dirección");
      hasError = true;
    }

    if (hasError) return;

    const confirm = await showConfirmModalAlert("¿Estás seguro de cambiar tu dirección?");
    if (!confirm) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth("/users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "address": { state, city, address } }),
      });

      if (response.ok) {
        refreshUser();
        toastSuccess("Dirección actualizada");
        navigation.goBack();
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError(data.error_detail);
      } else {
        toastError("Error", "No se pudo cambiar tu dirección");
      }
      } catch (error) {
        toastError("Error", "Error de conexión");
      } finally {
        setLoading(false);
        setState("AR-X");
        setCity("Cruz Del Eje");
        setAddress("");
      }
  };

  const styles = StyleSheet.create({
    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 25,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "80%",
      marginBottom: 10,
    },
    input: {
      flex: 1,
      height: 40,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
      paddingHorizontal: 8,
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    inputError: {
      borderColor: isDarkMode ? inputErrorDark : inputErrorLight,
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
    pickerSelect: {
      inputIOS: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      inputAndroid: {
        fontSize: 22,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
    },
  });

  return (
    <FormContainer>
      <Text style={styles.title}>Provincia</Text>
      <View style={[styles.inputContainer, {justifyContent: "center"}]}>
        <RNPickerSelect
          value={state}
          onValueChange={(value) => setState(value)}
          items={Object.entries(gymInfo.states).map(([key, label]) => ({
            label,
            value: key,
            color: defaultTextLight,
          }))}
          style={styles.pickerSelect}
          useNativeAndroidPickerStyle={false}
          placeholder={{}}
        />
      </View>

      <Text style={styles.title}>Ciudad</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, cityError ? styles.inputError : null]}
          placeholder="Escribe tu ciudad..."
          placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          value={city}
          onChangeText={(text) => {
            setCity(text);
            setCityError("");
          }}
        />
      </View>
      {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}

      <Text style={styles.title}>Dirección</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, addressError ? styles.inputError : null]}
          placeholder="Escribe tu dirección..."
          placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            setAddressError("");
          }}
        />
      </View>
      {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}

      <TouchableButton title="Cambiar Dirección" onPress={handleChangeAddress} loading={loading} />
    </FormContainer>
  );
}
