import React, { useContext, useState } from "react";
import { Text, StyleSheet, View } from "react-native";
import { GymContext } from "../../../context/GymContext";
import { getThemeColors, getCommonStyles } from "../../../constants/UI/theme";
import { formatExerciseType } from "../../../utils/formatters";
import TouchableButton from "../../../components/Buttons/TouchableButton";
import ImageViewing from "react-native-image-viewing";
import ScrollContainer from "../../../components/Containers/ScrollContainer";

export default function TraineeExerciseDetail({ route, navigation }) {
  const { exercise: selectedExercise } = route.params;
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const { isDarkMode } = useContext(GymContext);

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const styles = StyleSheet.create({
    exerciseDetail: {
      fontSize: 16,
      color: t.text,
      marginBottom: 5,
    },
    label: {
      fontSize: 16,
      color: t.secondText,
      fontWeight: "bold",
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollContainer style={{ paddingHorizontal: 25, paddingVertical: 20 }}>
        <Text style={[common.titleText, { marginBottom: 20, fontSize: 24, marginTop: 10 }]}>
          {selectedExercise?.exercise.name}
        </Text>
        
        <View style={common.cardContainer}>
          <Text style={styles.exerciseDetail}>
            <Text style={styles.label}>Grupo muscular:</Text> {formatExerciseType(selectedExercise?.exercise.type)}
          </Text>
          <Text style={styles.exerciseDetail}>
            <Text style={styles.label}>Series:</Text> {selectedExercise?.sets ? selectedExercise?.sets : "N/A"}
          </Text>
          <Text style={styles.exerciseDetail}>
            <Text style={styles.label}>Repeticiones:</Text> {selectedExercise?.reps || "N/A"}
          </Text>
          <Text style={styles.exerciseDetail}>
            <Text style={styles.label}>Descanso:</Text> {selectedExercise?.rest || "N/A"}
          </Text>
        </View>

        <View style={[common.cardContainer, { marginTop: 15 }]}>
          <Text style={[styles.label, { marginBottom: 10, fontSize: 18 }]}>Descripción:</Text>
          {selectedExercise?.exercise.description ? selectedExercise.exercise.description.split('\n').map((paragraph, index) => (
            <Text key={index} style={styles.exerciseDetail}>
              {paragraph === "" ? " " : paragraph}
            </Text>
          )) : <Text style={styles.exerciseDetail}>Sin descripción</Text>}

          {selectedExercise?.description ? (
            <>
              <Text style={[styles.label, { marginTop: 20, marginBottom: 10, fontSize: 18 }]}>Anotaciones del entrenador:</Text>
              {selectedExercise.description.split('\n').map((paragraph, index) => (
                <Text key={index} style={styles.exerciseDetail}>
                  {paragraph === "" ? " " : paragraph}
                </Text>
              ))}
            </>
          ) : null}
        </View>

        {selectedExercise?.exercise?.illustration ? (
          <TouchableButton
            title="Mostrar Ejercicio"
            onPress={() => setIsImageViewerVisible(true)}
            style={{ marginTop: 20, alignSelf: "center", width: "100%" }}
          />
        ) : null}
        <TouchableButton
          title="Volver"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 10, alignSelf: "center", width: "100%", marginBottom: 30 }}
        />
      </ScrollContainer>

      {selectedExercise?.exercise?.illustration ? (
        <ImageViewing
          images={[{ uri: selectedExercise.exercise.illustration }]}
          imageIndex={0}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
        />
      ) : null}
    </View>
  );
}
