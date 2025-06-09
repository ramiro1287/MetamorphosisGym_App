import React, { useContext, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute } from "@react-navigation/native";
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
  mainBackgroundDark, mainBackgroundLight
} from "../../../../constants/UI/colors";

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

  const onChange = async (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    setShowPicker(false);
    setForm({ ...form, expiration_date: selectedDate });
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 20,
      paddingTop: 0,
      width: "100%",
      marginTop: 15,
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
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      inputAndroid: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
    },
    dateInput: {
      backgroundColor: isDarkMode ? mainBackgroundDark : mainBackgroundLight,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
  });

  return (
    <ScrollContainer style={{ paddingHorizontal: 25 }}>
      <Text style={[styles.titleText, { fontSize: 20 }]}>Plan para:</Text>
      <Text style={styles.titleText}>{fullName}</Text>
      <View style={styles.cardContainer}>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Fecha de expiración:</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)}>
            <Text style={styles.cardInputLabel}>
            {form.expiration_date
              ? `${String(form.expiration_date.getDate()).padStart(2, '0')}/${String(form.expiration_date.getMonth() + 1).padStart(2, '0')}/${form.expiration_date.getFullYear()}`
              : ""
            }
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Anotaciones:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.description}
            multiline
            onChangeText={(t) => handleChange("description", t)}
          />
        </View>
      </View>

      <TouchableButton
        title="Crear plan"
        onPress={handleSubmit}
        loading={loading}
        style={{ alignSelf: "center", marginVertical: 20 }}
      />

      {showPicker && (
        <DateTimePicker
          value={form.expiration_date ? new Date(form.expiration_date) : new Date()}
          mode="date"
          display="spinner"
          onChange={onChange}
          minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
        />
      )}
    </ScrollContainer>
  );
}
