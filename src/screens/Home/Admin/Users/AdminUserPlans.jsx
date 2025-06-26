import React, { useContext, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, Modal, TextInput } from "react-native";
import { GymContext } from "../../../../context/GymContext";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
  inputErrorDark, inputErrorLight,
} from "../../../../constants/UI/colors";

export default function AdminUserPlans() {
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { isDarkMode, gymInfo, getGymInfo } = useContext(GymContext);

  const handleEditPlan = (IdPlan) => {
    const selectedPlan = gymInfo.plans.find((p) => p.id === IdPlan);

    if (selectedPlan) {
      setPlan({ ...selectedPlan });
      setPlanError("");
      setShowModal(true);
    }
  };

  const handleUpdatePrice = async () => {
    const parsedPrice = parseFloat(plan.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setPlanError("Ingrese un precio válido");
      return;
    }

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de actualizar el precio del plan?"
    );
    if (!confirm) {
      setShowModal(false);
      setPlan(null);
      setPlanError("");
      return;
    }

    try {
      const response = await fetchWithAuth(
        `/admin/users/update-plan/${plan.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: parseFloat(parsedPrice.toFixed(2)) }),
        }
      );

      if (response.ok) {
        toastSuccess("Precio actualizado correctamente");
        setShowModal(false);
        getGymInfo();
        return;
      } else {
        setShowModal(false);
        setPlan(null);
        toastError("Error", "No se pudo actualizar el precio");
        return;
      }
    } catch (error) {
      setShowModal(false);
      setPlan(null);
      toastError("Error", "Error de conexión");
    }
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      borderRadius: 20,
      padding: 15,
      width: "100%",
      marginBottom: 20,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    cardRowContainer: {
      flexDirection: "row",
      marginBottom: 5,
    },
    cardRowTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? secondTextDark : secondTextLight,
      marginRight: 6,
    },
    cardRowText: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      borderWidth: 1.5,
      padding: 20,
      borderRadius: 12,
      width: "80%",
    },
    modalCardTitle: {
      fontSize: 18,
      marginBottom: 10,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      alignSelf: "center",
    },
    modalCardButtonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
    },
    modalCardTextInput: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Tipo de planes</Text>
      <ScrollContainer>
        {gymInfo.plans.length ? gymInfo.plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => handleEditPlan(plan.id)}
            style={styles.cardContainer}
          >
            <View style={styles.cardRowContainer}>
              <Text style={styles.cardRowTitle}>Plan:</Text>
              <Text style={styles.cardRowText}>{plan.name}</Text>
            </View>
            <View style={styles.cardRowContainer}>
              <Text style={styles.cardRowTitle}>Precio:</Text>
              <Text style={styles.cardRowText}>{plan.price}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <Text style={styles.titleText}>Sin planes...</Text>
        )}
      </ScrollContainer>

      {showModal && plan ? (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCardContainer}>
              <Text style={styles.modalCardTitle}>
                Editar precio del plan: {plan.name}
              </Text>
              <TextInput
                keyboardType="numeric"
                value={plan.price}
                onChangeText={(txt) => {
                  setPlan({ ...plan, price: txt});
                  setPlanError("");
                }}
                style={styles.modalCardTextInput}
                placeholder="Ingrese precio del plan"
                placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
              />
              {planError && <Text style={styles.errorText}>{planError}</Text>}

              <View style={styles.modalCardButtonsContainer}>
                <TouchableButton title="Cancelar" onPress={() => {
                  setShowModal(false);
                  setPlan(null);
                  setPlanError("");
                }} />
                <TouchableButton title="Guardar" onPress={handleUpdatePrice} style={{ marginLeft: 15 }} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
