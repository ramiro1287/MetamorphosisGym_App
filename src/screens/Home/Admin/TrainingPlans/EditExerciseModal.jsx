import React, { useContext, useState } from "react";
import { View, Text, Modal, TextInput, StyleSheet } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { defaultTextLight } from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { WeekDaysMap } from "../../../../constants/trainingPlans";

export default function EditExerciseModal({ exercise, onClose, reload }) {
  const { isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

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

    if (formData.reps !== "" && formData.reps.length > 32) {
      newErrors.reps = "Máximo 32 caracteres";
    }

    if (formData.rest !== "" && formData.rest.length > 32) {
      newErrors.rest = "Máximo 32 caracteres";
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
            reps: formData.reps || null,
            rest: formData.rest || null,
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
    cardModalContainer: {
      backgroundColor: t.secondBackground,
      borderRadius: 16,
      padding: 20,
      width: "90%",
    },
    cardTitle: {
      fontSize: 20,
      color: t.text,
      alignSelf: "center",
    },
    cardInputLabel: {
      fontSize: 16,
      color: t.text,
    },
    cardInput: {
      color: t.text,
      fontSize: 16,
      borderBottomWidth: 1,
      borderColor: t.text,
      marginBottom: 20,
    },
  });

  const weekdayOptions = Object.entries(WeekDaysMap).map(([key, label]) => ({
    label, value: parseInt(key), color: defaultTextLight
  }));

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={common.modalContainer}>
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
            placeholderTextColor={t.text}
          />

          <Text style={styles.cardInputLabel}>Día de la semana</Text>
          <RNPickerSelect
            value={formData.week_day}
            onValueChange={(value) => handleChange("week_day", value)}
            items={weekdayOptions}
            style={common.pickerSelect}
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
          />
          {errors.week_day && (<Text style={common.errorText}>{errors.week_day}</Text>)}

          <Text style={styles.cardInputLabel}>Series</Text>
          <TextInput
            value={formData.sets}
            onChangeText={(text) => handleChange("sets", text)}
            keyboardType="numeric"
            style={styles.cardInput}
            placeholder="Cantidad de series"
            placeholderTextColor={t.text}
          />
          {errors.sets && (<Text style={common.errorText}>{errors.sets}</Text>)}

          <Text style={styles.cardInputLabel}>Repeticiones</Text>
          <TextInput
            value={formData.reps}
            onChangeText={(text) => handleChange("reps", text)}
            style={styles.cardInput}
            placeholder="N/A"
            placeholderTextColor={t.text}
          />
          {errors.reps && (<Text style={common.errorText}>{errors.reps}</Text>)}

          <Text style={styles.cardInputLabel}>Descanso</Text>
          <TextInput
            value={formData.rest}
            onChangeText={(text) => handleChange("rest", text)}
            style={styles.cardInput}
            placeholder="N/A"
            placeholderTextColor={t.text}
          />
          {errors.rest && (<Text style={common.errorText}>{errors.rest}</Text>)}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 20 }}>
            <TouchableButton title="Cancelar" onPress={onClose} />
            <TouchableButton title="Guardar" onPress={handleSave} style={{ marginLeft: 10 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
