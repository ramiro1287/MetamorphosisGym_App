// Ruta sugerida: src/screens/.../ExerciseFormModal.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TextInput, StyleSheet } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
} from "../../../../constants/UI/colors";
import { ExercisesMap } from "../../../../constants/trainingPlans";

export default function ExerciseFormModal({ visible, onClose, initialData, onSaved }) {
  const isEdit = !!initialData;
  const { isDarkMode } = useContext(GymContext);
  const [form, setForm] = useState({
    type: "",
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({
        type: initialData.type || "",
        name: initialData.name || "",
        description: initialData.description || "",
      });
    } else {
      setForm({ type: "", name: "", description: "" });
    }
  }, [initialData, isEdit, visible]);

  const isValid = useMemo(() => {
    return form.type && form.name.trim().length > 0 && form.description.trim().length > 0;
  }, [form]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toastError("Campos incompletos", "Completá tipo, nombre y descripción");
      onSaved?.();
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        const resp = await fetchWithAuth(
          `/admin/training-plans/exercises/update/${initialData.id}/`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: form.type,
              name: form.name.trim(),
              description: form.description.trim(),
            }),
          }
        );
        if (resp.ok) {
          toastSuccess("Ejercicio actualizado");
          onSaved?.();
        } else if (resp.status === 404) {
          toastError("", "Ejercicio no encontrado");
        } else if (resp.status === 400) {
          const { data } = await resp.json();
          toastError("Error de validación", data?.error_detail || "Datos inválidos");
        } else {
          toastError("Error", "No se pudo actualizar");
        }
      } else {
        // POST /create/
        const resp = await fetchWithAuth(
          `/admin/training-plans/exercises/create/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: form.type,
              name: form.name.trim(),
              description: form.description.trim(),
            }),
          }
        );
        if (resp.ok || resp.status === 201) {
          toastSuccess("Ejercicio creado");
          onSaved?.();
        } else if (resp.status === 400) {
          const { data } = await resp.json();
          toastError("Error de validación", data?.error_detail || "Datos inválidos");
        } else {
          toastError("Error", "No se pudo crear");
        }
      }
    } catch (e) {
      toastError("Error", "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    rootModalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center"
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      padding: 20,
      borderRadius: 20,
      width: "90%",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 12,
      alignSelf: "center",
    },
    input: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 16,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    pickerSelect: {
      inputIOS: {
        fontSize: 16,
        backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
        marginBottom: 10,
      },
      inputAndroid: {
        fontSize: 16,
        backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
        marginBottom: 10,
      },
      placeholder: { color: isDarkMode ? defaultTextDark : defaultTextLight },
    },
    actionsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.rootModalContainer}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>{isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}</Text>

          <RNPickerSelect
            value={form.type}
            onValueChange={(val) => handleChange("type", val)}
            items={Object.entries(ExercisesMap).map(([type, label]) => ({
              label, value: type, color: defaultTextLight,
            }))}
            style={styles.pickerSelect}
            useNativeAndroidPickerStyle={false}
            placeholder={{ label: "Seleccionar grupo muscular", value: "" }}
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
            value={form.name}
            onChangeText={(t) => handleChange("name", t)}
            maxLength={80}
          />

          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            placeholder="Descripción"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
            value={form.description}
            onChangeText={(t) => handleChange("description", t)}
            maxLength={256}
            multiline
          />

          <View style={styles.actionsRow}>
            <TouchableButton title="Cancelar" onPress={onClose} disabled={submitting} />
            <TouchableButton
              title={isEdit ? "Guardar" : "Crear"}
              onPress={handleSubmit}
              disabled={submitting}
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}