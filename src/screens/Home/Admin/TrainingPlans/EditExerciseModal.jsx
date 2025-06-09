import React, { useContext, useState } from "react";
import { View, Text, Modal, TextInput, StyleSheet } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  inputErrorDark, inputErrorLight,
} from "../../../../constants/UI/colors";
import { WeekDaysMap } from "../../../../constants/trainingPlans";

export default function EditExerciseModal({ exercise, onClose, reload }) {
  const { isDarkMode } = useContext(GymContext);

  const [formData, setFormData] = useState({
    description: exercise.description || "",
    week_day: exercise.week_day,
    sets: exercise.sets ? String(exercise.sets) : "",
    reps: exercise.reps ? String(exercise.reps): "",
    rest: exercise.rest !== null ? String(exercise.rest) : "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: null });
  };

  const validate = () => {
    const newErrors = {};
    const isPositiveInteger = (str) => /^([1-9]\d*)$/.test(str);
    const isNonNegativeInteger = (str) => /^(\d+)$/.test(str);

    if (!formData.week_day) {
      newErrors.week_day = "Seleccione un día";
    }

    if (formData.sets === "") {
      if (formData.reps !== "") {
        newErrors.reps = "No puede haber repeticiones sin no hay series";
      }
    } else if (!isPositiveInteger(formData.sets)) {
      newErrors.sets = "Ingrese un numero entero mayor a 0";
    }

    if (formData.reps !== "" && !isPositiveInteger(formData.reps)) {
      newErrors.reps = "Ingrese un numero entero mayor a 0";
    }

    if (formData.rest !== "" && !isNonNegativeInteger(formData.rest)) {
      newErrors.rest = "Ingrese un numero entero mayor o igual a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const confirm = await showConfirmModalAlert("¿Desea guardar los cambios del ejercicio?");
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/exercise-detail/${exercise.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            sets: formData.sets ? parseInt(formData.sets) : null,
            reps: formData.reps ? parseInt(formData.reps) : null,
            rest: formData.rest ? parseInt(formData.rest) : null,
          })
        }
      );
      if (response.ok) {
        toastSuccess("Ejercicio actualizado correctamente");
        reload();
        onClose();
      } else {
        toastError("Error", "No se pudo actualizar el ejercicio");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const styles = StyleSheet.create({
    rootModalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    cardModalContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 16,
      padding: 20,
      width: "90%",
    },
    cardTitle: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      alignSelf: "center",
    },
    cardInputLabel: {
      fontSize: 16,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    cardInput: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 16,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 20,
    },
    pickerSelect: {
      inputIOS: {
        fontSize: 16,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      inputAndroid: {
        fontSize: 16,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
  });

  const weekdayOptions = Object.entries(WeekDaysMap).map(([key, label]) => ({
    label, value: parseInt(key), color: defaultTextLight
  }));

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.rootModalContainer}>
        <View style={styles.cardModalContainer}>
          <Text style={[styles.cardTitle, { fontSize: 18 }]}>Editar ejercicio</Text>
          <Text style={[styles.cardTitle, { marginBottom: 15 }]}>{exercise.exercise.name}</Text>

          <Text style={styles.cardInputLabel}>Descripción (opcional)</Text>
          <TextInput
            value={formData.description}
            onChangeText={(txt) => handleChange("description", txt)}
            multiline
            style={styles.cardInput}
            placeholder="N/A"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          />

          <Text style={styles.cardInputLabel}>Día de la semana</Text>
          <RNPickerSelect
            value={formData.week_day}
            onValueChange={(value) => handleChange("week_day", value)}
            items={weekdayOptions}
            style={styles.pickerSelect}
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
          />
          {errors.week_day && (<Text style={styles.errorText}>{errors.week_day}</Text>)}

          <Text style={styles.cardInputLabel}>Series</Text>
          <TextInput
            value={formData.sets}
            onChangeText={(text) => handleChange("sets", text)}
            keyboardType="numeric"
            style={styles.cardInput}
            placeholder="Cantidad de series"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          />
          {errors.sets && (<Text style={styles.errorText}>{errors.sets}</Text>)}

          <Text style={styles.cardInputLabel}>Repeticiones</Text>
          <TextInput
            value={formData.reps}
            onChangeText={(text) => handleChange("reps", text)}
            keyboardType="numeric"
            style={styles.cardInput}
            placeholder={formData.sets ? "Hasta el fallo" : "N/A"}
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          />
          {errors.reps && (<Text style={styles.errorText}>{errors.reps}</Text>)}

          <Text style={styles.cardInputLabel}>Descanso</Text>
          <TextInput
            value={formData.rest}
            onChangeText={(text) => handleChange("rest", text)}
            keyboardType="numeric"
            style={styles.cardInput}
            placeholder="Hasta recuperarse"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          />
          {errors.rest && (<Text style={styles.errorText}>{errors.rest}</Text>)}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 20 }}>
            <TouchableButton title="Cancelar" onPress={onClose} />
            <TouchableButton title="Guardar" onPress={handleSave} style={{ marginLeft: 10 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
