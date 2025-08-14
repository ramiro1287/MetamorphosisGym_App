import React, { useContext, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Switch,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useNavigation } from "@react-navigation/native";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../context/GymContext";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { CoachRole, TraineeRole } from "../../../../constants/users";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark, inputErrorDark,
  errorButtonTextDark, inputErrorLight,
} from "../../../../constants/UI/colors";

export default function AdminCreateUser() {
  const [form, setForm] = useState({
    id_number: "",
    first_name: "",
    last_name: "",
    is_retired: false,
    role: TraineeRole,
    plan_id: null,
    phone: "",
    country: "AR",
  });
  const [idNumberError, setIdNumberError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [planError, setPlanError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { isDarkMode, gymInfo } = useContext(GymContext);

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
    pickerSelect: {
      inputIOS: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      inputAndroid: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
  });

  return (
    <ScrollContainer>
      <Text style={styles.titleText}>Nuevo Usuario</Text>
      <View style={styles.cardContainer}>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>DNI:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.id_number}
            onChangeText={(t) => handleChange("id_number", t)}
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
            onChangeText={(t) => handleChange("first_name", t)}
          />
        </View>
        {firstNameError && (<Text style={styles.errorText}>{firstNameError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Apellido:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.last_name}
            onChangeText={(t) => handleChange("last_name", t)}
          />
        </View>
        {lastNameError && (<Text style={styles.errorText}>{lastNameError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Teléfono:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.phone}
            onChangeText={(t) => handleChange("phone", t)}
            placeholder="Sin teléfono"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          />
        </View>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>País del Teléfono:</Text>
          <RNPickerSelect
            value={form.country}
            onValueChange={(v) => handleChange("country", v)}
            items={Object.entries(gymInfo.countries || {}).map(([key, value]) => ({
              label: value,
              value: key,
              color: defaultTextLight,
            }))}
            style={styles.pickerSelect}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
          />
        </View>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Rol:</Text>
          <RNPickerSelect
            value={form.role}
            onValueChange={(v) => handleChange("role", v)}
            items={[
              { label: "Entrenador", value: CoachRole, color: defaultTextLight },
              { label: "Cliente", value: TraineeRole, color: defaultTextLight },
            ]}
            style={styles.pickerSelect}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
          />
        </View>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Plan:</Text>
          <RNPickerSelect
            value={form.plan_id}
            onValueChange={(v) => handleChange("plan_id", v)}
            items={[
              { label: "Sin plan", value: null, color: defaultTextLight },
              ...(gymInfo.plans?.map((plan) => ({
                label: plan.name,
                value: plan.id,
                color: defaultTextLight,
              })) || []),
            ]}
            style={styles.pickerSelect}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
          />
        </View>
        {planError && (<Text style={styles.errorText}>{planError}</Text>)}
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>¿Es jubilado?</Text>
          <Switch
            value={form.is_retired}
            onValueChange={(v) => handleChange("is_retired", v)}
            trackColor={{
              false: isDarkMode ? defaultTextDark : defaultTextLight,
              true: isDarkMode ? defaultTextDark : defaultTextLight
            }}
            thumbColor={form.is_retired ? buttonTextConfirmDark : errorButtonTextDark}
            ios_backgroundColor={isDarkMode ? defaultTextDark : defaultTextLight}
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
