import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import debounce from "lodash.debounce";
import PickerSelect from "../../../../components/Picker/PickerSelect";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { ExercisesMap } from "../../../../constants/trainingPlans";
import ExerciseFormModal from "./ExerciseFormModal";

const PAGE_SIZE = 10;

export default function AadminExercises() {
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const [filters, setFilters] = useState({ type: "", name: "" });
  const [exercises, setExercises] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    q.append("page_size", String(PAGE_SIZE));
    if (filters.type) q.append("type", filters.type);
    if (filters.name) q.append("name", filters.name);
    return q.toString();
  }, [filters.type, filters.name]);

  const fetchPage = useCallback(async ({ url, append = false } = {}) => {
    try {
      const finalUrl = url ?? `/admin/training-plans/exercises/?${buildQuery()}`;
      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json();
      setNextUrl(data.next ?? null);
      setExercises(prev => (append ? [...prev, ...data.results] : data.results));
      setConnectionError(false);
    } catch (error) {
      if (error.message === 'Network request failed' || error.message === 'Network') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  }, [buildQuery]);

  useEffect(() => {
    setNextUrl(null);
    const debounced = debounce(async () => {
      setLoading(true);
      try { await fetchPage({ append: false }); }
      finally { setLoading(false); }
    }, 400);

    debounced();
    return () => debounced.cancel();
  }, [filters, fetchPage]);

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
        fetchPage({ append: false });
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
      backgroundColor: t.secondBackground,
      borderWidth: 1,
      borderColor: t.text,
      color: t.text,
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
      color: t.text,
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
      color: t.text,
      flex: 1,
    },
    text: { color: t.text, marginBottom: 5 },
  });

  const handleRetry = async () => {
    setConnectionError(false);
    setLoading(true);
    try { await fetchPage({ append: false }); }
    finally { setLoading(false); }
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;

  return (
    <View style={styles.rootContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ejercicios</Text>
        <TouchableButton title="+ Nuevo ejercicio" onPress={handleOpenCreate} />
      </View>

      <PickerSelect
        value={filters.type}
        onValueChange={(val) => handleChange("type", val)}
        items={Object.entries(ExercisesMap).map(([type, label]) => ({
          label, value: type,
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
        ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
      >
        {loading && !exercises.length ? (
          <ActivityIndicator />
        ) : exercises.length > 0 ? exercises.map((ex) => (
          <View key={ex.id} style={common.cardContainerBordered}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{ex.name}</Text>
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <Icon
                  name="edit"
                  size={24}
                  color={t.icon}
                  style={[common.touchableIconContainer, { marginRight: 10 }]}
                  onPress={() => handleOpenEdit(ex)}
                />
                <Icon
                  name="delete"
                  size={24}
                  color={t.icon}
                  style={common.touchableIconContainer}
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
            fetchPage({ append: false });
          }}
        />
      )}
    </View>
  );
}
