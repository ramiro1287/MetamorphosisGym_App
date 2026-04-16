import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import ScrollContainer from "../../../../../components/Containers/ScrollContainer";
import LoadingScreen from "../../../../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../../../../components/NoConnection/NoConnectionScreen";
import TouchableButton from "../../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../../context/GymContext";
import { fetchWithAuth } from "../../../../../services/authService";
import { toastError, toastSuccess } from "../../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../../components/Alerts/ConfirmModalAlert";
import AddTemplateExerciseModal from "./AddTemplateExerciseModal";
import EditTemplateExerciseModal from "./EditTemplateExerciseModal";
import { getThemeColors, getCommonStyles } from "../../../../../constants/UI/theme";
import { WeekDaysMap } from "../../../../../constants/trainingPlans";
import { buttonTextConfirmDark } from "../../../../../constants/UI/colors";

export default function AdminTrainingPlanDetail() {
  const [template, setTemplate] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [editTitle, setEditTitle] = useState(null);
  const [editDescription, setEditDescription] = useState(null);

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { templateId } = route.params || {};
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(useCallback(() => {
    setConnectionError(false);
    loadTemplate();
  }, []));

  const loadTemplate = async () => {
    try {
      const response = await fetchWithAuth(`/admin/training-plans/templates/detail/${templateId}/`);
      if (response.ok) {
        const { data } = await response.json();
        setTemplate(data);
      } else {
        throw new Error('Not found')
      }
    } catch (error) {
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    loadTemplate();
  };

  const handleDeleteExercise = async (exerciseId) => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar el ejercicio?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/templates/exercise-detail/${exerciseId}/`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toastSuccess("Ejercicio eliminado");
        loadTemplate();
      } else {
        toastError("Error", "No se pudo eliminar el ejercicio");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleDeleteTemplate = async () => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar esta plantilla de entrenamiento?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/templates/detail/${templateId}/`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        toastSuccess("Plantilla eliminada correctamente");
        navigation.reset({
          index: 1,
          routes: [
            { name: "Home" },
            { name: "AdminTrainingPlans" },
          ]
        });
      }
      else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
        return;
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const updateTemplateField = async (field, value) => {
    try {
      const body = {};
      body[field] = value;
      const response = await fetchWithAuth(
        `/admin/training-plans/templates/detail/${templateId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (response.ok) {
        toastSuccess("Actualizado correctamente");
        loadTemplate();
      }
      else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleUpdateTitle = async () => {
    if (editTitle !== null) {
      const trimmedNewValue = editTitle.trim();
      const originalValue = template.title?.trim() || "";

      if (trimmedNewValue === originalValue) {
        setEditTitle(null);
        return;
      }

      if (!trimmedNewValue) {
        toastError("Error", "El título no puede estar vacío");
        return;
      }

      const confirm = await showConfirmModalAlert("¿Estás seguro de actualizar el título?");
      if (!confirm) {
        setEditTitle(null);
        return;
      }

      await updateTemplateField("title", trimmedNewValue);
      setEditTitle(null);
    } else {
      setEditTitle(template.title);
    }
  };

  const handleUpdateDescription = async () => {
    if (editDescription !== null) {
      const trimmedNewValue = editDescription.trim();
      const originalValue = template.description?.trim() || "";

      if (trimmedNewValue === originalValue) {
        setEditDescription(null);
        return;
      }

      const confirm = await showConfirmModalAlert("¿Estás seguro de actualizar anotaciones?");
      if (!confirm) {
        setEditDescription(null);
        return;
      }

      await updateTemplateField("description", trimmedNewValue === "" ? null : trimmedNewValue);
      setEditDescription(null);
    } else {
      setEditDescription(template.description || "");
    }
  };

  const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: t.secondBackground,
      borderRadius: 20,
      padding: 15,
      marginBottom: 20,
      width: "90%",
      alignSelf: "center",
    },
    label: {
      fontSize: 16,
      color: t.secondText,
      fontWeight: "bold",
    },
    value: {
      fontSize: 16,
      color: t.text,
    },
    editionRow: {
      flexWrap: "wrap",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    },
    exerciseTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: t.text,
    },
    daySelectorContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: 30,
      gap: 10,
    },
    rowInput: {
      flex: 1,
      fontSize: 16,
      color: t.text,
      borderBottomWidth: 1,
      borderColor: t.text,
    },
  });

  const exercisesByDay = (template?.exercises || []).reduce((acc, ex) => {
    if (!acc[ex.week_day]) acc[ex.week_day] = [];
    acc[ex.week_day].push(ex);
    return acc;
  }, {});

  Object.values(exercisesByDay).forEach((list) =>
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );

  const handleReorder = async (data) => {
    const exercises = data.map((ex, index) => ({ id: ex.id, order: index }));

    setTemplate((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        const updated = exercises.find((e) => e.id === ex.id);
        return updated ? { ...ex, order: updated.order } : ex;
      }),
    }));

    try {
      await fetchWithAuth("/admin/training-plans/templates/exercise-detail/reorder/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises }),
      });
    } catch (error) {
      toastError("Error", "No se pudo guardar el orden");
      loadTemplate();
    }
  };

  const renderExerciseCard = useCallback(({ item: ex, drag, isActive }) => (
    <ScaleDecorator>
      <View
        style={[
          styles.cardContainer,
          isActive && { opacity: 0.85, elevation: 8 },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Icon
            name="drag-indicator"
            size={24}
            color={t.secondText}
            style={{ marginRight: 8 }}
            onLongPress={drag}
          />
          <Text style={[styles.exerciseTitle, { flex: 1 }]}>{ex.exercise.name}</Text>
        </View>
        <Text style={styles.value}>
          Series: {ex.sets || "N/A"}
        </Text>
        <Text style={styles.value}>
          Reps: {ex.reps || "N/A"}
        </Text>
        <Text style={styles.value}>
          Descanso: {ex.rest || "N/A"}
        </Text>
        {ex.description ? (
          <Text style={[styles.value, { fontStyle: "italic" }]}>
            Anotaciones: {ex.description.length > 15 ? ex.description.slice(0, 15) + "..." : ex.description}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Icon
            name="edit"
            size={25}
            color={t.icon}
            style={{ marginRight: 8 }}
            onPress={() => setSelectedExercise(ex)}
          />
          <Icon
            name="delete"
            size={25}
            color={t.icon}
            style={{ marginLeft: 8 }}
            onPress={() => handleDeleteExercise(ex.id)}
          />
        </View>
      </View>
    </ScaleDecorator>
  ), [t, styles]);

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;
  if (!template) return <LoadingScreen />;

  return (
    <View style={{ flex: 1 }}>
      <Text style={[common.titleText, { fontSize: 20, marginBottom: 15 }]}>Detalle de Plantilla</Text>

      <ScrollContainer style={{ paddingHorizontal: 25, alignItems: "none" }}>
        <View style={styles.cardContainer}>
          <Text style={styles.label}>Título:</Text>
          <View style={styles.editionRow}>
            {editTitle !== null ? (
              <TextInput
                style={styles.rowInput}
                value={editTitle}
                onChangeText={(val) => setEditTitle(val)}
                placeholderTextColor={t.text}
              />
            ) : (
              <Text style={[styles.value, { flexShrink: 1 }]}>
                {template.title}
              </Text>
            )}
            <Icon
              name={editTitle !== null ? "save" : "edit"}
              size={25}
              color={t.icon}
              style={{ marginLeft: 10 }}
              onPress={handleUpdateTitle}
            />
          </View>

          <Text style={styles.label}>Anotaciones:</Text>
          <View style={styles.editionRow}>
            {editDescription !== null ? (
              <TextInput
                style={styles.rowInput}
                value={editDescription}
                onChangeText={(val) => setEditDescription(val)}
                multiline
                placeholder="N/A"
                placeholderTextColor={t.text}
              />
            ) : (
              <Text style={[styles.value, { flexShrink: 1 }]}>
                {template.description ? template.description : "N/A"}
              </Text>
            )}
            <Icon
              name={editDescription !== null ? "save" : "edit"}
              size={25}
              color={t.icon}
              style={{ marginLeft: 10 }}
              onPress={handleUpdateDescription}
            />
          </View>
          <Icon
            name="delete"
            size={25}
            color={t.icon}
            style={{ alignSelf: "flex-end" }}
            onPress={handleDeleteTemplate}
          />
        </View>

        <View style={styles.daySelectorContainer}>
          {Object.entries(WeekDaysMap).map(([day, label]) => {
            const intDay = parseInt(day);
            const isActive = exercisesByDay[intDay]?.length > 0;
            return (
              <TouchableButton
                key={day}
                title={label}
                onPress={() => setSelectedDay(intDay)}
                disabled={!isActive}
                style={[
                  isActive ? { opacity: isActive ? 1 : 0.4 } : {},
                  selectedDay === intDay ? {
                    color: buttonTextConfirmDark,
                    borderWidth: 2,
                    borderColor: buttonTextConfirmDark
                  } : { borderWidth: 2, }
                ]}
                textButtonStyle={[
                  { fontSize: 14 },
                  selectedDay === intDay ? { color: buttonTextConfirmDark } : {}
                ]}
              />
            );
          })}
        </View>

        <TouchableButton
          title="+ Agregar ejercicio"
          onPress={() => setShowAddExerciseModal(true)}
          style={{ marginBottom: 25, alignSelf: "center" }}
        />

        {selectedDay && exercisesByDay[selectedDay]?.length > 0 ? (
          <DraggableFlatList
            data={exercisesByDay[selectedDay]}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderExerciseCard}
            onDragEnd={({ data }) => handleReorder(data)}
            scrollEnabled={false}
          />
        ) : null}
      </ScrollContainer>

      {selectedExercise && (
        <EditTemplateExerciseModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          reload={loadTemplate}
        />
      )}

      {showAddExerciseModal && (
        <AddTemplateExerciseModal
          templateId={template.id}
          onClose={() => setShowAddExerciseModal(false)}
          reload={loadTemplate}
          setSelectedExercise={setSelectedExercise}
        />
      )}
    </View>
  );
}
