import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, Modal, TouchableOpacity } from "react-native";
import { GymContext } from "../../../context/GymContext";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../services/authService";
import { toastError } from "../../../components/Toast/Toast";
import {
  ExerciseArms, ExerciseBack, ExerciseLegs,
  ExerciseChest, ExerciseAbs,
} from "../../../constants/trainingPlans";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
  buttonTextConfirmDark,
} from "../../../constants/UI/colors";
import { WeekDaysMap } from "../../../constants/trainingPlans";
import TouchableButton from "../../../components/Buttons/TouchableButton";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function TraineePlans() {
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode } = useContext(GymContext);

  useFocusEffect(
    useCallback(() => {
      loadTrainingPlan();
    }, [])
  );

  const loadTrainingPlan = async () => {
    try {
      const response = await fetchWithAuth("/training-plans/list/");
      if (response.ok) {
        const { data } = await response.json();
        if (data["results"].length > 0) {
          setTrainingPlan(data["results"][0]);
          setSelectedDay(1);
        }
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Sin vencimiento";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  };

  const formatExerciseType = (type) => {
    if (type === ExerciseArms) return "Brazos";
    if (type === ExerciseBack) return "Espalda";
    if (type === ExerciseLegs) return "Piernas";
    if (type === ExerciseChest) return "Pecho";
    if (type === ExerciseAbs) return "Abdominales";
    return "Grupo desconocido";
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginVertical: 20,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 15,
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color: isDarkMode ? secondTextDark : secondTextLight,
      fontWeight: "bold",
    },
    value: {
      fontSize: 16,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
    },
    daySelectorContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: 30,
      gap: 10,
    },
    exerciseItem: {
      marginVertical: 10,
      borderTopWidth: 1,
      borderColor: "#888",
      paddingTop: 10,
    },
    exerciseTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      flexDirection: "row",
      alignItems: "center",
    },
    exerciseDetail: {
      fontSize: 16,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    iconRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
  });

  const exercisesByDay = trainingPlan?.exercises.reduce((acc, ex) => {
    if (!acc[ex.week_day]) acc[ex.week_day] = [];
    acc[ex.week_day].push(ex);
    return acc;
  }, {}) || {};

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.titleText}>Plan de ejercitación</Text>
      <ScrollContainer style={{ paddingHorizontal: 25 }}>
        {trainingPlan ? (
          <>
            <View style={styles.cardContainer}>
              <Text style={styles.label}>Entrenador:</Text>
              <Text style={styles.value}>{trainingPlan.coach}</Text>
              <Text style={styles.label}>Válido hasta:</Text>
              <Text style={styles.value}>{formatDate(trainingPlan.expiration_date)}</Text>
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
                      } : { borderWidth: 2 }
                    ]}
                    textButtonStyle={[
                      { fontSize: 14 },
                      selectedDay === intDay ? {color: buttonTextConfirmDark} : {}
                    ]}
                  />
                );
              })}
            </View>

            {exercisesByDay[selectedDay]?.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={styles.cardContainer}
                onPress={() => {
                  setSelectedExercise(ex);
                  setModalVisible(true);
                }}
              >
                <View style={styles.iconRow}>
                  <Icon name="bolt" size={25} color={isDarkMode ? iconDark : iconLight} />
                  <Text style={styles.exerciseTitle}>{ex.exercise.name}</Text>
                </View>
                <Text style={styles.exerciseDetail}>
                  Series: {ex.sets}  |  Repeticiones: {ex.reps}
                </Text>
                <Text style={styles.exerciseDetail}>
                  Descanso: {ex.rest ? `${ex.rest} segundos` : "Hasta recuperarse"}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <Text style={styles.titleText}>Sin plan...</Text>
        )}
      </ScrollContainer>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)"
        }}>
          <View style={{
            backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
            borderRadius: 20,
            padding: 20,
            width: "85%",
            maxHeight: "70%",
          }}>
            <ScrollContainer style={{ alignItems: "flex-start" }}>
              <Text style={[styles.titleText, { fontSize: 20 }]}>
                {selectedExercise?.exercise.name}
              </Text>
              <Text style={styles.exerciseDetail}>
                Grupo muscular: {formatExerciseType(selectedExercise?.exercise.type)}
              </Text>
              <Text style={styles.exerciseDetail}>
                Series: {selectedExercise?.sets ? selectedExercise?.sets : "N/A"}
              </Text>
              <Text style={styles.exerciseDetail}>
                Repeticiones: {selectedExercise?.reps ? selectedExercise?.reps : "Hasta el fallo"}
              </Text>
              <Text style={styles.exerciseDetail}>
                Descanso: {selectedExercise?.rest ? `${selectedExercise?.rest} segundos` : "Hasta recuperarse"}
              </Text>
              <Text style={[styles.label, { marginTop: 10 }]}>Descripción:</Text>
              <Text style={styles.exerciseDetail}>
                {selectedExercise?.exercise.description}
              </Text>
              {selectedExercise?.description ? (
                <>
                  <Text style={[styles.label, { marginTop: 10 }]}>Anotaciones del entrenador:</Text>
                  <Text style={styles.exerciseDetail}>
                    {selectedExercise.description}
                  </Text>
                </>
              ) : null}
              <TouchableButton
                title="Cerrar"
                onPress={() => setModalVisible(false)}
                style={{ marginTop: 15, alignSelf: "center" }}
              />
            </ScrollContainer>
          </View>
        </View>
      </Modal>
    </View>
  );
}
