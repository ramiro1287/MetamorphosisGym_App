
import React, { useContext, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../context/GymContext";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  inputErrorDark, inputErrorLight,
} from "../../../../constants/UI/colors";

export default function AdminFamilyCreate() {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { isDarkMode } = useContext(GymContext);

  const handleChange = (key, value) => {
    if (key === "name") setNameError("");
    if (key === "description") setDescriptionError("");

    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    let hasError = false;

    if (!form.name) {
      setNameError("Ingresar nombre de la familia");
      hasError = true;
    }

    if (!form.description) {
      setDescriptionError("Ingresar alguna descripcion");
      hasError = true;
    }

    if (hasError) return;

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de crear la nueva familia?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(
        "/admin/users/family/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (response.ok) {
        toastSuccess("Familia creada correctamente");
        navigation.goBack();
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
      }
    } catch (error) {
      toastError("Error al crear la familia");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 15,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 20,
      paddingTop: 0,
      width: "80%",
    },
    cardInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 15,
    },
    cardInputLabel: {
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginRight: 10,
    },
    cardInput: {
      flex:1,
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
  });

  return (
    <ScrollContainer>
      <Text style={styles.titleText}>Nueva Familia</Text>
      <View style={styles.cardContainer}>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Nombre:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.name}
            onChangeText={(t) => handleChange("name", t)}
          />
        </View>
        {nameError && (<Text style={styles.errorText}>{nameError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Descripcion:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.description}
            onChangeText={(t) => handleChange("description", t)}
          />
        </View>
        {descriptionError && (<Text style={styles.errorText}>{descriptionError}</Text>)}
        <TouchableButton
          title="Crear familia"
          onPress={handleSubmit}
          loading={loading}
          style={{ alignSelf: "center", marginTop: 10 }}
        />
      </View>
    </ScrollContainer>
  );
}
