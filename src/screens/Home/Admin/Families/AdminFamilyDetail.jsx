import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, Modal, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondTextDark, secondTextLight,
  secondBackgroundDark, secondBackgroundLight,
  inputErrorDark,
} from "../../../../constants/UI/colors";

export default function AdminFamilyDetail() {
  const [family, setFamily] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [editValueError, setEditValueError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();

  useFocusEffect(
    useCallback(() => {
      loadFamily();
    }, [])
  );

  const loadFamily = async () => {
    try {
      const { familyId } = route.params || {};
      const response = await fetchWithAuth(`/admin/users/family/${familyId}/`);
      if (response.ok) {
        const { data } = await response.json();
        setFamily(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  if (!family) return <LoadingScreen />;

  const handleEditionModal = (field) => {
    setEditField(field);
    setEditValueError(null);
    if (field === "name") setEditValue(family.name);
    if (field === "description") setEditValue(family.description);
    setShowModal(true);
  };

  const handleSaveField = async () => {
    const { familyId } = route.params || {};
    let hasError = false
    let payload = {}

    if (editField === "name") {
      if (!editValue.trim()) {
        setEditValueError("El nombre no puede estar vacío");
        hasError = true;
      }
      if (hasError) return;
    }

    const confirm = await showConfirmModalAlert(
        "¿Estás seguro de actualizar el campo de la familia?"
    );
    if (!confirm) {
        setShowModal(false);
        return;
    }

    if (editField === "description" && !editValue.trim()) {
      payload = { [editField]: null }
    } else {
      payload = { [editField]: editValue }
    }

    try {
      const response = await fetchWithAuth(
        `/admin/users/family/${familyId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toastSuccess("Campo actualizado correctamente");
        setShowModal(false);
        loadFamily();
        return;
      } if (response.status === 400) {
        setShowModal(false);
        const { data } = await response.json();
        toastError(data.error_detail);
        return;
      } else {
        setShowModal(false);
        toastError("Error", "No se pudo actualizar el campo");
        return;
      }
    } catch (error) {
      setShowModal(false);
      toastError("Error", "Error de conexión");
    }
  };

  const handleRemoveMember = async (idNumber) => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar el miembro de la familia?"
    );
    if (!confirm) return;

    const { familyId } = route.params || {};
    try {
      const response = await fetchWithAuth(
        `/admin/users/family/${familyId}/remove-user/${idNumber}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        toastSuccess("Miembro eliminado correctamente");
        loadFamily();
        return;
      }
      toastError("Error", "No se pudo eliminar el miembro");
      return;
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleDeleteFamily = async () => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar la familia?"
    );
    if (!confirm) return;

    const { familyId } = route.params || {};
    try {
      const response = await fetchWithAuth(
        `/admin/users/family/${familyId}/`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        toastSuccess("Familia eliminada correctamente");
        navigation.goBack();
        return;
      }
      toastError("Error", "No se pudo eliminar la familia");
      return;
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleAddMember = () => {
    const { familyId } = route.params || {};

    navigation.reset({
      index: 3,
      routes: [
        { name: "Home" },
        { name: "AdminFamilies" },
        { name: "AdminFamilyDetail", params: { familyId } },
        { name: "AdminFamilyAdd", params: { familyId } },
      ]
    });
  };

  const styles = StyleSheet.create({
    profileCard: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      width: "100%",
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 10,
      alignItems: "flex-start",
      flexWrap: "wrap",
    },
    label: {
      color: isDarkMode ? secondTextDark : secondTextLight,
      fontSize: 18,
    },
    value: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 18,
      flex: 1,
      textAlign: "right",
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
    titleText: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 22,
      fontWeight: 500,
      marginTop: 15,
    },
    memberCardContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      borderRadius: 20,
      padding: 15,
      width: "100%",
      marginBottom: 20,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    memberText: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 18,
      fontWeight: 500,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <View style={styles.profileCard}>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Nombre</Text>
            <Icon
              name="edit"
              size={25}
              color={isDarkMode ? iconDark : iconLight}
              onPress={() => handleEditionModal("name")}
              style={{ marginLeft: 5 }}
            />
          </View>
          <Text style={styles.value}>{family.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Descripción</Text>
            <Icon
              name="edit"
              size={25}
              color={isDarkMode ? iconDark : iconLight}
              onPress={() => handleEditionModal("description")}
              style={{ marginLeft: 5 }}
            />
          </View>
          <Text style={styles.value}>{family.description ? family.description : "N/A"}</Text>
        </View>
        <Icon
          name="delete"
          size={35}
          color={isDarkMode ? iconDark : iconLight}
          onPress={handleDeleteFamily}
          style={{ alignSelf: "flex-end", marginTop: 10, marginRight: 10 }}
        />
      </View>

      {family.members && (
        <>
          <Text style={styles.titleText}>Miembros</Text>
          <Icon
            name="person-add"
            size={35}
            color={isDarkMode ? iconDark : iconLight}
            onPress={handleAddMember}
            style={{ alignSelf: "flex-end", marginBottom: 20, marginRight: 10 }}
          />
        </>
      )}

      {family.members ? family.members.map((member) => (
        <View key={member.id_number} style={styles.memberCardContainer}>
          <Text style={styles.memberText}>{member.first_name} {member.last_name}</Text>
          <Icon
            name="delete"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => handleRemoveMember(member.id_number)}
            style={{ marginLeft: 5 }}
          />
        </View>
      )) : (
        <Text style={styles.memberText}>Sin miembros</Text>
      )}

      {showModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCardContainer}>
              {editField === "name" ? (
                <>
                  <Text style={styles.modalCardTitle}>Editar nombre de la familia</Text>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    style={styles.modalCardTextInput}
                  />
                  {editValueError && <Text style={styles.errorText}>{editValueError}</Text>}
                </>
              ) : (
                <>
                  <Text style={styles.modalCardTitle}>Editar descripción</Text>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    style={styles.modalCardTextInput}
                    multiline
                  />
                  {editValueError && <Text style={styles.errorText}>{editValueError}</Text>}
                </>
              )}
              <View style={styles.modalCardButtonsContainer}>
                <TouchableButton title="Cancelar" onPress={() => setShowModal(false)} />
                <TouchableButton title="Guardar" onPress={handleSaveField} style={{ marginLeft: 15 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollContainer>
  );
}
