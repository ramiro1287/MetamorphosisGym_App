import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, Modal, TextInput, StyleSheet } from "react-native";
import debounce from "lodash.debounce";
import PickerSelect from "../../../../components/Picker/PickerSelect";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { ExercisesMap, WeekDaysMap } from "../../../../constants/trainingPlans";

export default function AddExerciseModal({ planId, onClose, reload, setSelectedExercise }) {
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);
  const [filters, setFilters] = useState({ type: "", name: "" });
  const [exercises, setExercises] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    q.append("page_size", "10");
    if (filters.type) q.append("type", filters.type);
    if (filters.name) q.append("name", filters.name);
    return q.toString();
  }, [filters.type, filters.name]);

  const fetchPage = useCallback(async ({ url, append = false } = {}) => {
    try {
      const finalUrl = url ?? `/admin/training-plans/exercises/?${buildQuery()}`;
      const response = await fetchWithAuth(finalUrl);
      if (response.ok) {
        const { data } = await response.json();
        setNextUrl(data.next ?? null);
        setExercises(prev => (append ? [...prev, ...data.results] : data.results));
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  }, [buildQuery]);

  const debouncedSearch = useCallback(debounce(() => {
    fetchPage({ append: false });
  }, 400), [fetchPage]);

  useEffect(() => {
    setNextUrl(null);
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [filters, debouncedSearch]);

  const loadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try {
      await fetchPage({ url: nextUrl, append: true });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddExercise = async (exerciseId) => {
    onClose();
    const confirm = await showConfirmModalAlert("¿Agregar este ejercicio al plan?");
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/exercise-detail/add/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: planId, exercise_id: exerciseId, week_day: selectedDay }),
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
    }
  };

  const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: t.secondBackground,
      padding: 20,
      borderRadius: 20,
      width: "90%",
      maxHeight: "90%",
    },
    input: {
      borderWidth: 1,
      borderColor: t.text,
      color: t.text,
      fontSize: 16,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    card: {
      backgroundColor: t.secondBackground,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderRightWidth: 3,
      borderBottomWidth: 1,
      borderTopWidth: 1,
      borderColor: t.text,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: t.text,
      marginBottom: 10,
    },
    text: {
      color: t.text,
      marginBottom: 5,
    },
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={common.modalContainer}>
        <View style={styles.cardContainer}>
          <Text style={[styles.title, { alignSelf: "center" }]}>Agregar ejercicio</Text>

          <PickerSelect
            value={filters.type}
            onValueChange={(val) => handleChange("type", val)}
            items={Object.entries(ExercisesMap).map(([type, label]) => ({
              label,
              value: type,
            }))}
            placeholder="Filtrar por grupo muscular"
            style={{ marginBottom: 10 }}
          />

          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre"
            placeholderTextColor={t.text}
            value={filters.name}
            onChangeText={(text) => handleChange("name", text)}
          />

          <ScrollContainer
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            loadingMore={loadingMore}
          >
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

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <PickerSelect
                value={selectedDay}
                onValueChange={(val) => setSelectedDay(parseInt(val))}
                items={Object.entries(WeekDaysMap).map(([day, label]) => ({
                  label,
                  value: parseInt(day),
                }))}
              />
            </View>
            <TouchableButton title="Cerrar" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
