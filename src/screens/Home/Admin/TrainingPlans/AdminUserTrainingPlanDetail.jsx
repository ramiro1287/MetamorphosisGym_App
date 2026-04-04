import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import RNPickerSelect from "react-native-picker-select";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import DateTimePicker from "@react-native-community/datetimepicker";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import EditExerciseModal from "./EditExerciseModal";
import AddExerciseModal from "./AddExerciseModal";
import {
  buttonTextConfirmDark, errorButtonTextDark,
  defaultTextLight,
} from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { formatDate, formatPlanStatus } from "../../../../utils/formatters";
import {
  WeekDaysMap, PlanStatusActive,
  PlanStatusFinish, PlanStatusCanceled,
} from "../../../../constants/trainingPlans";

export default function AdminUserTrainingPlanDetail() {
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editPlanStatus, setEditPlanStatus] = useState(null);
  const [editPlanDescription, setEditPlanDescription] = useState(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { idNumber, planId, fullName } = route.params || {};
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(useCallback(() => {
    setConnectionError(false);
    loadPlan();
  }, []));

  const loadPlan = async () => {
    try {
      const response = await fetchWithAuth(`/admin/training-plans/detail/${planId}/`);
      if (response.ok) {
        const { data } = await response.json();
        setTrainingPlan(data);
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
    loadPlan();
  };

  const handleDeleteExercise = async (exerciseId) => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar el ejercicio?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/exercise-detail/${exerciseId}/`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toastSuccess("Ejercicio eliminado");
        loadPlan();
      } else {
        toastError("Error", "No se pudo eliminar el ejercicio");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleDeletePlan = async () => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar el plan de entrenamiento?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/update/${planId}/`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (response.ok) {
        toastSuccess("Plan eliminado correctamente");
        navigation.reset({
          index: 3,
          routes: [
            { name: "Home" },
            { name: "AdminUsers" },
            { name: "AdminUserDetail", params: { idNumber } },
            { name: "AdminUserTrainingPlans", params: { idNumber, fullName } },
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

  const onChange = async (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de actualizar el vencimiento del plan de entrenamiento?"
    );
    if (!confirm) return;

    setShowDatePicker(false);
    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/update/${planId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expiration_date: selectedDate }),
        }
      );
      if (response.ok) {
        toastSuccess("Fecha actualizada correctamente");
        loadPlan();
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

  const updatePlanStatus = async () => {
    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/update/${planId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: editPlanStatus }),
        }
      );
      if (response.ok) {
        toastSuccess("Estado actualizado correctamente");
        loadPlan();
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

  const handleEditStatus = async () => {
    if (showStatusPicker) {
      if (editPlanStatus === trainingPlan.status) {
        setEditPlanStatus("");
        setShowStatusPicker(false);
      } else {
        const confirm = await showConfirmModalAlert(
          "¿Estás seguro de cambiar el estado del plan?"
        );
        if (!confirm) {
          setShowStatusPicker(false);
          return
        } else {
          updatePlanStatus();
          setShowStatusPicker(false);
        }
      }
    } else {
      setEditPlanStatus(trainingPlan.status);
      setShowStatusPicker(true);
    }
  };

  const updatePlanDescription = async () => {
    try {
      const response = await fetchWithAuth(
        `/admin/training-plans/update/${planId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: editPlanDescription === "" ? null : editPlanDescription
          }),
        }
      );
      if (response.ok) {
        toastSuccess("Anotaciones actualizada correctamente");
        loadPlan();
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

  const handleUpdateDescription = async () => {
    // Si está en modo edición (es decir, editPlanDescription no es null)
    if (editPlanDescription !== null) {
      const trimmedNewValue = editPlanDescription.trim();
      const originalValue = trainingPlan.description?.trim() || "";
  
      if (trimmedNewValue === originalValue) {
        // No hubo cambios, solo cerramos la edición
        setEditPlanDescription(null);
        return;
      }
  
      const confirm = await showConfirmModalAlert("¿Estás seguro de actualizar anotaciones?");
      if (!confirm) {
        setEditPlanDescription(null);
        return;
      }
  
      await updatePlanDescription();
      setEditPlanDescription(null);
    } else {
      // Activamos modo edición
      setEditPlanDescription(trainingPlan.description || "");
    }
  };  

  const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: t.secondBackground,
      borderRadius: 20,
      padding: 15,
      marginBottom: 20,
      minWidth: "70%",
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
      flexDirection: "row",
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
      flex:1,
      fontSize: 16,
      color: t.text,
      borderBottomWidth: 1,
      borderColor: t.text,
    },
  });

  const exercisesByDay = (trainingPlan?.exercises || []).reduce((acc, ex) => {
    if (!acc[ex.week_day]) acc[ex.week_day] = [];
    acc[ex.week_day].push(ex);
    return acc;
  }, {});

  Object.values(exercisesByDay).forEach((list) =>
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );

  const handleReorder = async (data) => {
    const exercises = data.map((ex, index) => ({ id: ex.id, order: index }));

    setTrainingPlan((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        const updated = exercises.find((e) => e.id === ex.id);
        return updated ? { ...ex, order: updated.order } : ex;
      }),
    }));

    try {
      await fetchWithAuth("/admin/training-plans/exercise-detail/reorder/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises }),
      });
    } catch (error) {
      toastError("Error", "No se pudo guardar el orden");
      loadPlan();
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
            Anotaciones: {ex.description.length > 10 ? ex.description.slice(0, 10) + "..." : ex.description}
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
  if (!trainingPlan) return <LoadingScreen />;

  return (
    <View style={{ flex: 1 }}>
      <Text style={[common.titleText, { fontSize: 20, marginBottom: 0 }]}>Plan de ejercitación de</Text>
      <Text style={[common.titleText, { marginBottom: 15 }]}>{fullName}</Text>
      <ScrollContainer style={{ paddingHorizontal: 25 }}>
        <View style={styles.cardContainer}>
          <Text style={styles.label}>Entrenador:</Text>
          <Text style={[styles.value, { marginBottom: 10 }]}>{trainingPlan.coach}</Text>
          <Text style={styles.label}>Estado:</Text>
          <View style={styles.editionRow}>
            {showStatusPicker ? (
                <RNPickerSelect
                  value={editPlanStatus}
                  onValueChange={(value) => setEditPlanStatus(value)}
                  items={[
                    { label: "Activo", value: PlanStatusActive, color: defaultTextLight },
                    { label: "Finalizado", value: PlanStatusFinish, color: defaultTextLight },
                    { label: "Cancelado", value: PlanStatusCanceled, color: defaultTextLight },
                  ]}
                  style={common.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
            ) : (
              <Text
                style={[
                  styles.value,
                  trainingPlan.status === PlanStatusActive
                  ? { color: buttonTextConfirmDark }
                  : { color: errorButtonTextDark }
                ]}
              >
                {formatPlanStatus(trainingPlan.status)}
              </Text>
            )}
            <Icon
              name={showStatusPicker ? "save" : "edit"}
              size={25}
              color={t.icon}
              style={{ marginLeft: 10 }}
              onPress={handleEditStatus}
            />
          </View>

          <Text style={styles.label}>Plan válido hasta:</Text>
          <View style={styles.editionRow}>
            <Text style={styles.value}>{formatDate(trainingPlan.expiration_date, "Sin vencimiento")}</Text>
            <Icon
              name="edit"
              size={25}
              color={t.icon}
              style={{ marginLeft: 10 }}
              onPress={() => {setShowDatePicker(true)}}
            />
          </View>

          <Text style={styles.label}>Anotaciones:</Text>
          <View style={styles.editionRow}>
            {editPlanDescription !== null ? (
              <TextInput
                style={styles.rowInput}
                value={editPlanDescription}
                onChangeText={(val) => setEditPlanDescription(val)}
                multiline
                placeholder="N/A"
                placeholderTextColor={t.text}
              />
            ) : (
              <Text style={styles.value}>
                {trainingPlan.description ? trainingPlan.description : "N/A"}
              </Text>
            )}
            <Icon
              name={editPlanDescription ? "save" : "edit"}
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
              onPress={handleDeletePlan}
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
                  selectedDay === intDay ? {color: buttonTextConfirmDark} : {}
                ]}
              />
            );
          })}
        </View>

        {selectedDay && exercisesByDay[selectedDay]?.length > 0 ? (
          <DraggableFlatList
            data={exercisesByDay[selectedDay]}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderExerciseCard}
            onDragEnd={({ data }) => handleReorder(data)}
            scrollEnabled={false}
          />
        ) : null}

        <TouchableButton
          title="+ Agregar ejercicio"
          onPress={() => setShowAddExerciseModal(true)}
          style={{ marginTop: 20 }}
        />
      </ScrollContainer>

      {selectedExercise && (
        <EditExerciseModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          reload={loadPlan}
        />
      )}

      {showAddExerciseModal && (
        <AddExerciseModal
          planId={trainingPlan.id}
          onClose={() => setShowAddExerciseModal(false)}
          reload={loadPlan}
          setSelectedExercise={setSelectedExercise}
        />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={trainingPlan.expiration_date ? new Date(trainingPlan.expiration_date) : new Date()}
          mode="date"
          display="spinner"
          onChange={onChange}
          minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
        />
      )}
    </View>
  );
}
