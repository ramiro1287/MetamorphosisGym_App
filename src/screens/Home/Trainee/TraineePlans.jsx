import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { GymContext } from "../../../context/GymContext";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../services/authService";
import { toastError } from "../../../components/Toast/Toast";
import NoConnectionScreen from "../../../components/NoConnection/NoConnectionScreen";
import { WeekDaysMap } from "../../../constants/trainingPlans";
import { buttonTextConfirmDark } from "../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../constants/UI/theme";
import { formatDate } from "../../../utils/formatters";
import TouchableButton from "../../../components/Buttons/TouchableButton";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function TraineePlans() {
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      setConnectionError(false);
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
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    loadTrainingPlan();
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const styles = StyleSheet.create({
    label: {
      fontSize: 16,
      color: t.secondText,
      fontWeight: "bold",
    },
    value: {
      fontSize: 16,
      color: t.text,
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
      color: t.text,
      flexDirection: "row",
      alignItems: "center",
    },
    exerciseDetail: {
      fontSize: 16,
      color: t.text,
    },
    iconRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    exerciseCard: {
      borderLeftWidth: 3,
      borderLeftColor: buttonTextConfirmDark,
    },
    exerciseCardContent: {
      flexDirection: "row",
      alignItems: "center",
    },
  });

  const exercisesByDay = trainingPlan?.exercises.reduce((acc, ex) => {
    if (!acc[ex.week_day]) acc[ex.week_day] = [];
    acc[ex.week_day].push(ex);
    return acc;
  }, {}) || {};

  return (
    <View style={{ flex: 1 }}>
      <Text style={[common.titleText, { marginVertical: 20, marginBottom: 0 }]}>Plan de ejercitación</Text>
      <ScrollContainer style={{ paddingHorizontal: 25 }}>
        {trainingPlan ? (
          <>
            <View style={common.cardContainer}>
              <Text style={styles.label}>Entrenador:</Text>
              <Text style={styles.value}>{trainingPlan.coach}</Text>
              <Text style={styles.label}>Válido hasta:</Text>
              <Text style={styles.value}>{formatDate(trainingPlan.expiration_date, "Sin vencimiento")}</Text>
              <Text style={styles.label}>Anotaciones Generales:</Text>
              <Text style={styles.value}>{trainingPlan.description}</Text>
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
                      selectedDay === intDay ? { color: buttonTextConfirmDark } : {}
                    ]}
                  />
                );
              })}
            </View>

            {exercisesByDay[selectedDay]?.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                activeOpacity={0.6}
                style={[common.cardContainer, styles.exerciseCard]}
                onPress={() => {
                  navigation.navigate("TraineeExerciseDetail", { exercise: ex });
                }}
              >
                <View style={styles.exerciseCardContent}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.iconRow}>
                      <Icon name="bolt" size={25} color={t.icon} />
                      <Text style={styles.exerciseTitle}>{ex.exercise.name}</Text>
                    </View>
                    <Text style={styles.exerciseDetail}>
                      Series: {ex.sets || 'N/A'}
                    </Text>
                    <Text style={styles.exerciseDetail}>
                      Repeticiones: {ex.reps || 'N/A'}
                    </Text>
                    <Text style={styles.exerciseDetail}>
                      Descanso: {ex.rest || "N/A"}
                    </Text>
                    {ex.description ? (
                      <Text style={[styles.value, { fontStyle: "italic" }]}>
                        Anotaciones: {ex.description.length > 10 ? ex.description.slice(0, 10) + "..." : ex.description}
                      </Text>
                    ) : null}
                  </View>
                  <Icon name="chevron-right" size={24} color={t.secondText} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <Text style={[common.titleText, { marginVertical: 20, marginBottom: 0 }]}>Sin plan...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
