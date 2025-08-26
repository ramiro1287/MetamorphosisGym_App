import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import debounce from "lodash.debounce";
import RNPickerSelect from "react-native-picker-select";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  iconDark, iconLight
} from "../../../../constants/UI/colors";
import { ExercisesMap } from "../../../../constants/trainingPlans";
import ExerciseFormModal from "./ExerciseFormModal";

export default function AadminExercises() {
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const [filters, setFilters] = useState({ type: "", name: "" });
  const [exercises, setExercises] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  const debouncedSearch = useCallback(
    debounce(() => { loadExercises(); }, 400),
    [filters]
  );

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
      } else {
        toastError("Error", "No se pudo obtener ejercicios");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenCreate = () => {
    setEditingExercise(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (exercise) => {
    setEditingExercise(exercise);
    setShowFormModal(true);
  };

  const handleDelete = async (exercise) => {
    const confirm = await showConfirmModalAlert(
      `¿Eliminar el ejercicio "${exercise.name}"?`
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/exercises/update/${exercise.id}/`,
        { method: "DELETE" }
      );
      if (response.ok) {
        toastSuccess("Ejercicio eliminado");
        loadExercises();
      } else if (response.status === 404) {
        toastError("", "Ejercicio no encontrado");
      } else {
        toastError("Error", "No se pudo eliminar el ejercicio");
      }
    } catch (e) {
      toastError("Error", "Error de conexión");
    }
  };

  const styles = StyleSheet.create({
    rootContainer: { padding: 25, flex: 1 },
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    card: {
      width: "100%",
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
    cardTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    text: { color: isDarkMode ? defaultTextDark : defaultTextLight, marginBottom: 5 },
    actionsRow: { flexDirection: "row", justifyContent: "flex-end" },
    actionIcon: { marginLeft: 12 }
    ,
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
    },
  });

  return (
    <View style={styles.rootContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ejercicios</Text>
        <TouchableButton title="+ Nuevo ejercicio" onPress={handleOpenCreate} />
      </View>

      <RNPickerSelect
        value={filters.type}
        onValueChange={(val) => handleChange("type", val)}
        items={Object.entries(ExercisesMap).map(([type, label]) => ({
          label, value: type, color: defaultTextLight,
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
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{ex.name}</Text>
              <View style={styles.actionsRow}>
                <Icon
                  name="edit"
                  size={24}
                  color={isDarkMode ? iconDark : iconLight}
                  style={styles.actionIcon}
                  onPress={() => handleOpenEdit(ex)}
                />
                <Icon
                  name="delete"
                  size={24}
                  color={isDarkMode ? iconDark : iconLight}
                  style={styles.actionIcon}
                  onPress={() => handleDelete(ex)}
                />
              </View>
            </View>
            <Text style={styles.text}>Tipo: {gymInfo?.exercise_types?.[ex.type] || ExercisesMap[ex.type] || ex.type}</Text>
            <Text style={styles.text}>{ex.description}</Text>
          </View>
        )) : (
          <Text style={styles.text}>No se encontraron ejercicios</Text>
        )}
      </ScrollContainer>

      {showFormModal && (
        <ExerciseFormModal
          visible={showFormModal}
          onClose={() => setShowFormModal(false)}
          initialData={editingExercise}
          onSaved={() => {
            setShowFormModal(false);
            loadExercises();
          }}
        />
      )}
    </View>
  );
}
