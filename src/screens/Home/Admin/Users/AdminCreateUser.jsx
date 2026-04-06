import React, { useContext, useState } from "react";
import {
  Text,
  View,
  TextInput,
  Switch,
} from "react-native";
import PickerSelect from "../../../../components/Picker/PickerSelect";
import { useNavigation } from "@react-navigation/native";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../context/GymContext";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { TraineeRole } from "../../../../constants/users";
import { buttonTextConfirmDark, errorButtonTextDark } from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";

export default function AdminCreateUser() {
  const navigation = useNavigation();
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const [form, setForm] = useState({
    id_number: "",
    first_name: "",
    last_name: "",
    is_retired: false,
    role: TraineeRole,
    plan_id: gymInfo?.plans?.[0]?.id || null,
    phone: "",
    country: "AR",
  });
  const [idNumberError, setIdNumberError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [planError, setPlanError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    if (key === "id_number") setIdNumberError("");
    if (key === "first_name") setFirstNameError("");
    if (key === "last_name") setLastNameError("");
    if (key === "plan_id") setPlanError("");

    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    let hasError = false;

    if (!form.id_number) {
      setIdNumberError("Ingresar DNI");
      hasError = true;
    } else if (!/^\d+$/.test(form.id_number)) {
      setIdNumberError("El DNI debe ser un número entero");
      hasError = true;
    }

    if (!form.first_name) {
      setFirstNameError("Ingresar nombre");
      hasError = true;
    }

    if (!form.last_name) {
      setLastNameError("Ingresar apellido");
      hasError = true;
    }

    if (form.role === TraineeRole && !form.plan_id) {
      setPlanError("Un cliente debe tener un plan");
      hasError = true;
    }

    if (hasError) return;

    if (form.phone === "") form.phone = null;

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de crear el nuevo usuario?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(
        "/admin/users/create-user/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (response.ok) {
        toastSuccess("Usuario creado correctamente");
        navigation.goBack();
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
      }
    } catch (error) {
      toastError("Error al crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    titleText: { ...common.titleText, marginBottom: 15 },
    cardContainer: common.formCardContainer,
    cardInputContainer: common.formInputContainer,
    cardInputLabel: common.formInputLabel,
    cardInput: common.formInput,
    errorText: common.errorText,
  };

  return (
    <ScrollContainer>
      <Text style={styles.titleText}>Nuevo Usuario</Text>
      <View style={styles.cardContainer}>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>DNI:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.id_number}
            onChangeText={(v) => handleChange("id_number", v)}
            keyboardType="numeric"
            inputMode="numeric"
            maxLength={10}
          />
        </View>
        {idNumberError && (<Text style={styles.errorText}>{idNumberError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Nombre:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.first_name}
            onChangeText={(v) => handleChange("first_name", v)}
          />
        </View>
        {firstNameError && (<Text style={styles.errorText}>{firstNameError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Apellido:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.last_name}
            onChangeText={(v) => handleChange("last_name", v)}
          />
        </View>
        {lastNameError && (<Text style={styles.errorText}>{lastNameError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Teléfono:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.phone}
            onChangeText={(v) => handleChange("phone", v)}
            placeholder="Sin teléfono"
            placeholderTextColor={t.text}
          />
        </View>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>País del Teléfono:</Text>
          <PickerSelect
            value={form.country}
            onValueChange={(v) => handleChange("country", v)}
            items={Object.entries(gymInfo.countries || {}).map(([key, value]) => ({
              label: value,
              value: key,
            }))}
          />
        </View>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Plan:</Text>
          <PickerSelect
            value={form.plan_id}
            onValueChange={(v) => handleChange("plan_id", v)}
            items={[
              { label: "Sin plan", value: null },
              ...(gymInfo.plans?.map((plan) => ({
                label: plan.name,
                value: plan.id,
              })) || []),
            ]}
          />
        </View>
        {planError && (<Text style={styles.errorText}>{planError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>¿Es jubilado?</Text>
          <Switch
            value={form.is_retired}
            onValueChange={(v) => handleChange("is_retired", v)}
            trackColor={{ false: t.text, true: t.text }}
            thumbColor={form.is_retired ? buttonTextConfirmDark : errorButtonTextDark}
            ios_backgroundColor={t.text}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>
        <TouchableButton
          title="Crear usuario"
          onPress={handleSubmit}
          loading={loading}
          style={{ alignSelf: "center", marginTop: 10 }}
        />
      </View>
    </ScrollContainer>
  );
}
