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
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";

export default function AdminFamilyDetail() {
  const [family, setFamily] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [editValueError, setEditValueError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(
    useCallback(() => {
      setConnectionError(false);
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
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    loadFamily();
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;
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

    setShowModal(false);

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de actualizar el campo de la familia?"
    );
    if (!confirm) return;

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
        loadFamily();
        return;
      } if (response.status === 400) {
        const { data } = await response.json();
        toastError(data.error_detail);
        return;
      } else {
        toastError("Error", "No se pudo actualizar el campo");
        return;
      }
    } catch (error) {
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
    titleText: {
      color: t.text,
      fontSize: 22,
      fontWeight: 500,
      marginTop: 15,
    },
    memberText: {
      color: t.text,
      fontSize: 18,
      fontWeight: 500,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <View style={common.profileCard}>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={common.label}>Nombre</Text>
            <Icon
              name="edit"
              size={25}
              color={t.icon}
              onPress={() => handleEditionModal("name")}
              style={[common.touchableIconContainer, { padding: 5, marginLeft: 10 }]}
            />
          </View>
          <Text style={common.value}>{family.name}</Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={common.label}>Descripción</Text>
            <Icon
              name="edit"
              size={25}
              color={t.icon}
              onPress={() => handleEditionModal("description")}
              style={[common.touchableIconContainer, { padding: 5, marginLeft: 10 }]}
            />
          </View>
          <Text style={common.value}>{family.description ? family.description : "N/A"}</Text>
        </View>
        <Icon
          name="delete"
          size={35}
          color={t.icon}
          onPress={handleDeleteFamily}
          style={[common.touchableIconContainer, { alignSelf: "flex-end" }]}
        />
      </View>


      <Text style={styles.titleText}>Miembros</Text>
      <Icon
        name="person-add"
        size={35}
        color={t.icon}
        onPress={handleAddMember}
        style={[common.touchableIconContainer, { alignSelf: "flex-end", marginBottom: 20 }]}
      />


      {family.members ? family.members.map((member) => (
        <View key={member.id_number} style={[common.cardContainerBordered, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
          <Text style={styles.memberText}>{member.first_name} {member.last_name}</Text>
          <Icon
            name="delete"
            size={25}
            color={t.icon}
            onPress={() => handleRemoveMember(member.id_number)}
            style={[common.touchableIconContainer, { padding: 5 }]}
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
          <View style={common.modalContainer}>
            <View style={common.modalCardContainer}>
              {editField === "name" ? (
                <>
                  <Text style={common.modalCardTitle}>Editar nombre de la familia</Text>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    style={common.modalCardTextInput}
                  />
                  {editValueError && <Text style={common.errorText}>{editValueError}</Text>}
                </>
              ) : (
                <>
                  <Text style={common.modalCardTitle}>Editar descripción</Text>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    style={common.modalCardTextInput}
                    multiline
                  />
                  {editValueError && <Text style={common.errorText}>{editValueError}</Text>}
                </>
              )}
              <View style={common.modalCardButtonsContainer}>
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
