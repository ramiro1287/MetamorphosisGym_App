import React, { useContext, useState } from "react";
import { Text, View, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScrollContainer from "../../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../../context/GymContext";
import TouchableButton from "../../../../../components/Buttons/TouchableButton";
import { fetchWithAuth } from "../../../../../services/authService";
import { toastError, toastSuccess } from "../../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../../components/Alerts/ConfirmModalAlert";
import { getThemeColors, getCommonStyles } from "../../../../../constants/UI/theme";

export default function AdminTrainingPlanCreate() {
  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toastError("Error", "El título es obligatorio");
      return;
    }

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de crear esta plantilla?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description ? form.description : null
      };

      const response = await fetchWithAuth(
        "/admin/training-plans/templates/create/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        const { data } = await response.json();
        toastSuccess("Plantilla creada correctamente");
        navigation.reset({
          index: 1,
          routes: [
            { name: "Home" },
            { name: "AdminTrainingPlanDetail", params: { templateId: data.id } },
          ]
        });
      }
      else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
        return;
      }
    } catch (error) {
      toastError("Error al crear la plantilla");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollContainer style={{ paddingHorizontal: 25 }}>
      <Text style={[common.titleText, { fontSize: 20, marginBottom: 15 }]}>Nueva Plantilla</Text>
      <View style={[common.formCardContainer, { width: "100%", marginTop: 15 }]}>
        <View style={common.formInputContainer}>
          <Text style={common.formInputLabel}>Título:</Text>
          <TextInput
            style={common.formInput}
            value={form.title}
            onChangeText={(val) => handleChange("title", val)}
            placeholder="Ej. Principiantes 3 días"
            placeholderTextColor={t.text}
          />
        </View>
        <View style={{ marginTop: 15, width: "100%" }}>
          <Text style={[common.formInputLabel, { marginBottom: 5 }]}>Descripción (opcional):</Text>
          <TextInput
            style={[common.formInput, { flex: 0, width: "100%", minHeight: 60, textAlignVertical: "top" }]}
            value={form.description}
            placeholder="Sin descripción"
            placeholderTextColor={t.text}
            multiline
            onChangeText={(val) => handleChange("description", val)}
          />
        </View>
      </View>

      <TouchableButton
        title="Crear plantilla"
        onPress={handleSubmit}
        loading={loading}
        style={{ alignSelf: "center", marginVertical: 20 }}
      />
    </ScrollContainer>
  );
}
