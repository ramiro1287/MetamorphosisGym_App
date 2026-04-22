import React, { useContext, useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TextInput, StyleSheet, Image } from "react-native";
import { launchImageLibrary } from 'react-native-image-picker';
import PickerSelect from "../../../../components/Picker/PickerSelect";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { ExercisesMap } from "../../../../constants/trainingPlans";

export default function ExerciseFormModal({ visible, onClose, initialData, onSaved }) {
  const isEdit = !!initialData;
  const { isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const [form, setForm] = useState({
    type: "",
    name: "",
    description: "",
    illustration: null,
  });

  const [newImage, setNewImage] = useState(null);
  const [imageDeleted, setImageDeleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({
        type: initialData.type || "",
        name: initialData.name || "",
        description: initialData.description || "",
        illustration: initialData.illustration || null,
      });
    } else {
      setForm({ type: "", name: "", description: "", illustration: null });
    }
    setNewImage(null);
    setImageDeleted(false);
  }, [initialData, isEdit, visible]);

  const isValid = useMemo(() => {
    return form.type && form.name.trim().length > 0 && form.description.trim().length > 0;
  }, [form]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setNewImage(result.assets[0]);
      setImageDeleted(false);
    }
  };

  const handleRemoveImage = () => {
    setNewImage(null);
    setForm(prev => ({ ...prev, illustration: null }));
    setImageDeleted(true);
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toastError("Campos incompletos", "Completá tipo, nombre y descripción");
      onSaved?.();
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append("type", form.type);
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());

    if (newImage) {
      formData.append("illustration", {
        uri: newImage.uri,
        type: newImage.type || 'image/jpeg',
        name: newImage.fileName || 'image.jpg',
      });
    } else if (imageDeleted && isEdit) {
      formData.append("illustration", "");
    }

    try {
      if (isEdit) {
        const resp = await fetchWithAuth(
          `/admin/training-plans/exercises/update/${initialData.id}/`,
          {
            method: "PUT",
            body: formData,
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
        const resp = await fetchWithAuth(
          `/admin/training-plans/exercises/create/`,
          {
            method: "POST",
            body: formData,
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
    cardContainer: {
      backgroundColor: t.secondBackground,
      padding: 20,
      borderRadius: 20,
      width: "90%",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: t.text,
      marginBottom: 12,
      alignSelf: "center",
    },
    input: {
      backgroundColor: t.secondBackground,
      borderWidth: 1,
      borderColor: t.text,
      color: t.text,
      fontSize: 16,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    imagePreview: {
      width: '100%',
      height: 250,
      borderRadius: 12,
      marginBottom: 10,
      resizeMode: 'contain',
    },
    imageActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 8,
    },
    actionsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  });

  const displayImageUri = newImage ? newImage.uri : form.illustration;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={common.modalContainer}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>{isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}</Text>

          <PickerSelect
            value={form.type}
            onValueChange={(val) => handleChange("type", val)}
            items={Object.entries(ExercisesMap).map(([type, label]) => ({
              label, value: type,
            }))}
            placeholder="Seleccionar grupo muscular"
            style={{ marginBottom: 10 }}
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor={t.text}
            value={form.name}
            onChangeText={(val) => handleChange("name", val)}
            maxLength={80}
          />

          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            placeholder="Descripción"
            placeholderTextColor={t.text}
            value={form.description}
            onChangeText={(val) => handleChange("description", val)}
            maxLength={256}
            multiline
          />

          {displayImageUri ? (
            <View>
              <Image source={{ uri: displayImageUri }} style={styles.imagePreview} />
              <View style={styles.imageActions}>
                <TouchableButton title="Cambiar" onPress={handleSelectImage} style={{ flex: 1 }} />
                <TouchableButton title="Eliminar" onPress={handleRemoveImage} variant="error" style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <TouchableButton
              title="Agregar Imagen"
              onPress={handleSelectImage}
              style={{ marginBottom: 12 }}
            />
          )}

          <View style={styles.actionsRow}>
            <TouchableButton title="Cancelar" onPress={onClose} disabled={submitting} />
            <TouchableButton
              title={isEdit ? "Guardar" : "Crear"}
              onPress={handleSubmit}
              disabled={submitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}