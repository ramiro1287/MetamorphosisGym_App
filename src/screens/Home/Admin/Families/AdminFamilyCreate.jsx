
import React, { useContext, useState } from "react";
import {
  Text,
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
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";

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
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

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

  return (
    <ScrollContainer>
      <Text style={[common.titleText, { marginBottom: 15 }]}>Nueva Familia</Text>
      <View style={common.formCardContainer}>
        <View style={common.formInputContainer}>
          <Text style={common.formInputLabel}>Nombre:</Text>
          <TextInput
            style={common.formInput}
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
          />
        </View>
        {nameError && (<Text style={common.errorText}>{nameError}</Text>)}
        <View style={common.formInputContainer}>
          <Text style={common.formInputLabel}>Descripcion:</Text>
          <TextInput
            style={common.formInput}
            value={form.description}
            onChangeText={(text) => handleChange("description", text)}
          />
        </View>
        {descriptionError && (<Text style={common.errorText}>{descriptionError}</Text>)}
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
