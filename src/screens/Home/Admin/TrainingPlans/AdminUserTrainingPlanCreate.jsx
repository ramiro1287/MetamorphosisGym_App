import React, { useContext, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import DatePickerModal from "../../../../components/Picker/DatePickerModal";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../context/GymContext";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";

export default function AdminUserTrainingPlanCreate() {
  const defaultDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [form, setForm] = useState({
    description: "",
    expiration_date: defaultDate,
  });
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { isDarkMode } = useContext(GymContext);
  const route = useRoute();
  const { idNumber, fullName } = route.params || {};
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de crear plan de entrenamiento?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const playload = { ...form, trainee_id_number: idNumber };
      const response = await fetchWithAuth(
        "/admin/training-plans/create/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playload),
        }
      );
      if (response.ok) {
        const { data } = await response.json();
        toastSuccess("Plan creado correctamente");
        navigation.reset({
          index: 4,
          routes: [
            { name: "Home" },
            { name: "AdminUsers" },
            { name: "AdminUserDetail", params: { idNumber } },
            { name: "AdminUserTrainingPlans", params: { idNumber, fullName } },
            { name: "AdminUserTrainingPlanDetail", params: { idNumber, planId: data.id, fullName } },
          ]
        });
      }
      else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
        return;
      }
    } catch (error) {
      toastError("Error al crear el plan");
    } finally {
      setLoading(false);
    }
  };

  const onConfirmDate = (selectedDate) => {
    setShowPicker(false);
    setForm({ ...form, expiration_date: selectedDate });
  };

  const styles = StyleSheet.create({
    dateInput: {
      backgroundColor: t.background,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
  });

  return (
    <ScrollContainer style={{ paddingHorizontal: 25 }}>
      <Text style={[common.titleText, { fontSize: 20, marginBottom: 0 }]}>Plan para:</Text>
      <Text style={[common.titleText, { marginBottom: 0 }]}>{fullName}</Text>
      <View style={[common.formCardContainer, { width: "100%", marginTop: 15 }]}>
        <View style={common.formInputContainer}>
          <Text style={common.formInputLabel}>Fecha de expiración:</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)}>
            <Text style={common.formInputLabel}>
              {form.expiration_date
                ? `${String(form.expiration_date.getDate()).padStart(2, '0')}/${String(form.expiration_date.getMonth() + 1).padStart(2, '0')}/${form.expiration_date.getFullYear()}`
                : ""
              }
            </Text>
          </TouchableOpacity>
        </View>
        <View style={common.formInputContainer}>
          <Text style={common.formInputLabel}>Anotaciones:</Text>
          <TextInput
            style={common.formInput}
            value={form.description}
            multiline
            onChangeText={(val) => handleChange("description", val)}
          />
        </View>
      </View>

      <TouchableButton
        title="Crear plan"
        onPress={handleSubmit}
        loading={loading}
        style={{ alignSelf: "center", marginVertical: 20 }}
      />

      <DatePickerModal
        visible={showPicker}
        value={form.expiration_date ? new Date(form.expiration_date) : new Date()}
        onConfirm={onConfirmDate}
        onCancel={() => setShowPicker(false)}
        minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
      />
    </ScrollContainer>
  );
}
