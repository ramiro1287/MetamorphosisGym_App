import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, Modal, TextInput, StyleSheet } from "react-native";
import debounce from "lodash.debounce";
import RNPickerSelect from "react-native-picker-select";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
} from "../../../../constants/UI/colors";
import { ExercisesMap } from "../../../../constants/trainingPlans";

export default function AddExerciseModal({ planId, onClose, reload, setSelectedExercise }) {
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const [filters, setFilters] = useState({ type: "", name: "" });
  const [exercises, setExercises] = useState([]);

  const debouncedSearch = useCallback(debounce(() => {
    loadExercises();
  }, 400), [filters]);

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [filters]);

  const loadExercises = async () => {
    try {
      const query = new URLSearchParams();
      if (filters.type) query.append("type", filters.type);
      if (filters.name) query.append("name", filters.name);
      const response = await fetchWithAuth(`/admin/training-plans/exercises/?${query.toString()}`);
      if (response.ok) {
        const { data } = await response.json();
        setExercises(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddExercise = async (exerciseId) => {
    const confirm = await showConfirmModalAlert("¿Agregar este ejercicio al plan?");
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/exercise-detail/add/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: planId, exercise_id: exerciseId }),
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        toastSuccess("Ejercicio agregado con éxito");
        reload();
        setSelectedExercise(data);
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
      } else {
        toastError("Error", "No se pudo agregar el ejercicio");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    } finally {
      onClose();
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
      maxHeight: "90%",
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 16,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    card: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderRightWidth: 3,
      borderBottomWidth: 1,
      borderTopWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
    },
    text: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 5,
    },
    pickerSelect: {
      inputIOS: {
        fontSize: 16,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderRadius: 12,
        alignSelf: "center",
        marginBottom: 10,
        paddingHorizontal: 10,
      },
      inputAndroid: {
        fontSize: 16,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderRadius: 12,
        alignSelf: "center",
        marginBottom: 10,
        paddingHorizontal: 10,
      },
      placeholder: {
        color: isDarkMode ? defaultTextDark : defaultTextLight,
      },
    },
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.rootModalContainer}>
        <View style={styles.cardContainer}>
          <Text style={[styles.title, { alignSelf: "center" }]}>Agregar ejercicio</Text>

          <RNPickerSelect
            value={filters.type}
            onValueChange={(val) => handleChange("type", val)}
            items={Object.entries(ExercisesMap).map(([type, label]) => ({
              label,
              value: type,
              color: defaultTextLight,
            }))}
            style={styles.pickerSelect}
            useNativeAndroidPickerStyle={false}
            placeholder={{ label: "Filtrar por grupo muscular", value: "" }}
          />

          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre"
            placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
            value={filters.name}
            onChangeText={(text) => handleChange("name", text)}
          />

          <ScrollContainer>
            {exercises.length > 0 ? exercises.map((ex) => (
              <View key={ex.id} style={styles.card}>
                <Text style={styles.title}>{ex.name}</Text>
                <Text style={styles.text}>{ex.description}</Text>
                <Text style={styles.text}>Tipo: {gymInfo.exercise_types[ex.type]}</Text>
                <TouchableButton
                  title="Agregar al plan"
                  onPress={() => handleAddExercise(ex.id)}
                  style={{ marginTop: 10, alignSelf: "center" }}
                />
              </View>
            )) : (
              <Text style={styles.text}>No se encontraron ejercicios</Text>
            )}
          </ScrollContainer>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 15 }}>
            <TouchableButton title="Cerrar" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
