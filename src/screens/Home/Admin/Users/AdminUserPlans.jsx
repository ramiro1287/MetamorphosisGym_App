import React, { useContext, useState } from "react";
import { Text, View, TouchableOpacity, Modal, TextInput } from "react-native";
import { GymContext } from "../../../../context/GymContext";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";

export default function AdminUserPlans() {
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { isDarkMode, gymInfo, getGymInfo } = useContext(GymContext);

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

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

    setShowModal(false);

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de actualizar el precio del plan?"
    );
    if (!confirm) {
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
        getGymInfo();
        return;
      } else {
        setPlan(null);
        toastError("Error", "No se pudo actualizar el precio");
        return;
      }
    } catch (error) {
      setPlan(null);
      toastError("Error", "Error de conexión");
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={common.titleText}>Tipo de planes</Text>
      <ScrollContainer>
        {gymInfo.plans.length ? gymInfo.plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => handleEditPlan(plan.id)}
            style={common.cardContainerBordered}
          >
            <View style={[common.cardRowContainer, { marginBottom: 5 }]}>
              <Text style={[common.cardRowTitle, { fontSize: 18, fontWeight: "bold" }]}>Plan:</Text>
              <Text style={[common.cardRowText, { fontSize: 20 }]}>{plan.name}</Text>
            </View>
            <View style={[common.cardRowContainer, { marginBottom: 5 }]}>
              <Text style={[common.cardRowTitle, { fontSize: 18, fontWeight: "bold" }]}>Precio:</Text>
              <Text style={[common.cardRowText, { fontSize: 20 }]}>{plan.price}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <Text style={common.titleText}>Sin planes...</Text>
        )}
      </ScrollContainer>

      {showModal && plan ? (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={common.modalContainer}>
            <View style={common.modalCardContainer}>
              <Text style={common.modalCardTitle}>
                Editar precio del plan: {plan.name}
              </Text>
              <TextInput
                keyboardType="numeric"
                value={plan.price}
                onChangeText={(txt) => {
                  setPlan({ ...plan, price: txt });
                  setPlanError("");
                }}
                style={common.modalCardTextInput}
                placeholder="Ingrese precio del plan"
                placeholderTextColor={t.text}
              />
              {planError && <Text style={common.errorText}>{planError}</Text>}

              <View style={common.modalCardButtonsContainer}>
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
