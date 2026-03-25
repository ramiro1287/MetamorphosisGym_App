import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, Modal, TextInput } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useRoute } from "@react-navigation/native";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { useNavigation } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
    AdminRole, CoachRole, TraineeRole,
    StatusActive, StatusDeleted,
} from "../../../../constants/users";
import {
  inputErrorDark,
  defaultTextLight,
} from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { formatDate, formatRole, formatUserStatus } from "../../../../utils/formatters";

export default function AdminUserDetail() {
  const [userDetail, setUserDetail] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [editValueError, setEditValueError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const { isDarkMode, gymInfo, user } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const { idNumber } = route.params || {};
      const response = await fetchWithAuth(`/admin/users/detail/${idNumber}/`);
      if (response.ok) {
        const { data } = await response.json();
        setUserDetail(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  if (!userDetail) return <LoadingScreen />;

  const handleResetPassword = async () => {
    const { idNumber } = route.params || {};
    const confirm = await showConfirmModalAlert(
        "¿Estás seguro de restablecer la contraseña del usuario?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/users/reset-user-password/${idNumber}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (response.ok) {
        toastSuccess("Contraseña restablecida");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleEditionModal = (field) => {
    setEditField(field);
    setEditValueError(null);
    let currentValue = null;

    switch (field) {
      case "full_name":
      currentValue = {
        first_name: userDetail.first_name,
        last_name: userDetail.last_name,
      };
      break;
      case "plan":
      currentValue = userDetail.plan?.id || null;
      break;
      case "is_retired":
      currentValue = userDetail.is_retired ? 1 : 0;
      break;
      default:
      currentValue = userDetail[field] || "";
    }

    setEditValue(currentValue);
    setShowModal(true);
  };

  const handleSaveField = async () => {
    const { idNumber } = route.params || {};
    const payload = {};
    let hasError = false

    if (editField === "full_name") {
      if (!editValue.first_name.trim()) {
        setEditValueError({ first_name: "El nombre no puede estar vacío" });
        hasError = true;
      }
      if (!editValue.last_name.trim()) {
        setEditValueError((prev) => ({
          ...prev, last_name: "El apellido no puede estar vacío"
        }));
        hasError = true;
      }
      if (hasError) return;

      payload.first_name = editValue.first_name;
      payload.last_name = editValue.last_name;
    } else if (editField === "plan") {
      payload.plan_id = editValue;
    } else if (editField === "phone") {
      payload.phone = !editValue.trim() ? null : editValue;
      if (payload.phone) payload.country = 'AR';
    } else if (editField === "is_retired") {
      payload.is_retired = editValue;
    } else {
      payload[editField] = editValue;
    }

    const confirm = await showConfirmModalAlert(
        "¿Estás seguro de actualizar el campo del usuario?"
    );
    if (!confirm) {
        setShowModal(false);
        return;
    }

    try {
      const response = await fetchWithAuth(
        `/admin/users/update-user/${idNumber}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toastSuccess("Campo actualizado correctamente");
        setShowModal(false);
        loadUser();
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

  const formatFieldName = (field) => {
    if (field === "full_name") return "nombre completo";
    if (field === "role") return "rol";
    if (field === "status") return "estado";
    if (field === "is_retired") return "si es jubilado";
    if (field === "phone") return "teléfono";
    if (field === "plan") return "tipo de plan";
    return field;
  };

  const handlePayments = () => {
    const { idNumber } = route.params || {};
    const fullName = `${userDetail.first_name} ${userDetail.last_name}`

    navigation.reset({
      index: 3,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserDetail", params: { idNumber } },
        { name: "AdminUserPayments", params: { idNumber, fullName } },
      ]
    });
  };

  const handleTrainingPlans = () => {
    const { idNumber } = route.params || {};
    const fullName = `${userDetail.first_name} ${userDetail.last_name}`

    navigation.reset({
      index: 3,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserDetail", params: { idNumber } },
        { name: "AdminUserTrainingPlans", params: { idNumber, fullName } },
      ]
    });
  };

  const styles = StyleSheet.create({
      userName: {
        fontSize: 22,
        fontWeight: "bold",
        color: t.text,
      },
      userId: {
        fontSize: 16,
        color: t.secondText,
        marginBottom: 20,
      },
      buttonsCardContainer: {
        backgroundColor: t.secondBackground,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        width: "100%",
        marginTop: 25,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 15,
      },
    });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <View style={common.profileCard}>
        <Icon
          name="account-circle"
          size={120}
          color={t.icon}
        />
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.userName}>
            {userDetail.first_name} {userDetail.last_name}
          </Text>
          {
            (user.role === CoachRole && userDetail.role === TraineeRole)
            || user.role === AdminRole ? (
              <Icon
                name="edit"
                size={22}
                color={t.icon}
                onPress={() => handleEditionModal("full_name")}
                style={{ marginLeft: 5 }}
              />
            ) : null
          }
        </View>
        <Text style={styles.userId}>{userDetail.id_number}</Text>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Rol</Text>
            {user.role === AdminRole && user.id_number !== userDetail.id_number ? (
              <Icon
                name="edit"
                size={22}
                color={t.icon}
                onPress={() => handleEditionModal("role")}
                style={{ marginLeft: 5 }}
              />
            ): null}
          </View>
          <Text style={common.value}>{formatRole(userDetail.role)}</Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Estado</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole && user.id_number !== userDetail.id_number ? (
                <Icon
                  name="edit"
                  size={22}
                  color={t.icon}
                  onPress={() => handleEditionModal("status")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text
            style={[
                common.value,
                userDetail.status === StatusDeleted && { color: inputErrorDark }
            ]}
          >
            {formatUserStatus(userDetail.status)}
          </Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Plan</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole ? (
                <Icon
                  name="edit"
                  size={22}
                  color={t.icon}
                  onPress={() => handleEditionModal("plan")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text style={common.value}>
            {userDetail.plan ? userDetail.plan?.name : "N/A"}
          </Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Jubilado</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole ? (
                <Icon
                  name="edit"
                  size={22}
                  color={t.icon}
                  onPress={() => handleEditionModal("is_retired")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text style={common.value}>{userDetail.is_retired ? "Si" : "No"}</Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Teléfono</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole ? (
                <Icon
                  name="edit"
                  size={22}
                  color={t.icon}
                  onPress={() => handleEditionModal("phone")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text style={common.value}>
            {userDetail.phone ? userDetail.phone : "N/A"}
          </Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Familia</Text>
          <Text style={common.value}>
            {userDetail.family ? userDetail.family?.name : "N/A"}
          </Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Dirección</Text>
          <Text style={common.value} numberOfLines={2} ellipsizeMode="tail">
            {
              userDetail.address
              ? `${userDetail.address?.address} ${userDetail.address?.city} ${userDetail.address?.state}`
              : "N/A"
            }
          </Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Nacimiento</Text>
          <Text style={common.value} numberOfLines={2} ellipsizeMode="tail">
            {userDetail.birth_date ? formatDate(userDetail.birth_date) : "N/A"}
          </Text>
        </View>

        <TouchableButton
          title="Restablecer contraseña"
          onPress={handleResetPassword}
          style={{ marginTop: 15 }}
        />
      </View>

      <View style={styles.buttonsCardContainer}>
        <TouchableButton
          title="Cuotas"
          onPress={handlePayments}
          style={{}}
        />
        <TouchableButton
          title="Plan de entrenamiento"
          onPress={handleTrainingPlans}
          style={{}}
        />
      </View>

      {showModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={common.modalContainer}>
            <View style={common.modalCardContainer}>
              <Text style={common.modalCardTitle}>
                Editar {formatFieldName(editField)}
              </Text>

              {editField === "plan" ? (
                <RNPickerSelect
                  value={editValue}
                  onValueChange={(value) => setEditValue(value)}
                  items={[
                    { label: "Sin plan", value: null, color: defaultTextLight },
                    ...gymInfo.plans.map((plan) => ({
                      label: plan.name,
                      value: plan.id,
                      color: defaultTextLight,
                    })),
                  ]}
                  style={common.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
              ) : editField === "is_retired" ? (
                <RNPickerSelect
                  value={editValue}
                  onValueChange={(value) => setEditValue(value)}
                  items={[
                    { label: "No", value: 0, color: defaultTextLight },
                    { label: "Sí", value: 1, color: defaultTextLight },
                  ]}
                  style={common.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
              ) : editField === "role" ? (
                <RNPickerSelect
                  value={editValue}
                  onValueChange={(value) => setEditValue(value)}
                  items={[
                    { label: "Entrenador", value: CoachRole, color: defaultTextLight },
                    { label: "Cliente", value: TraineeRole, color: defaultTextLight },
                  ]}
                  style={common.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
              ) : editField === "status" ? (
                <RNPickerSelect
                  value={editValue}
                  onValueChange={(value) => setEditValue(value)}
                  items={[
                    { label: "Activo", value: StatusActive, color: defaultTextLight },
                    { label: "Inactivo", value: StatusDeleted, color: defaultTextLight },
                  ]}
                  style={common.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
              ) : editField === "full_name" ? (
                <>
                  <TextInput
                    value={editValue?.first_name}
                    onChangeText={(txt) => {
                        setEditValue(prev => ({ ...prev, first_name: txt}));
                        setEditValueError(prev => ({ ...prev, first_name: ""}));
                    }}
                    style={common.modalCardTextInput}
                    placeholder="Nombre"
                    placeholderTextColor={t.text}
                  />
                  {
                    editValueError?.first_name
                    ? <Text style={common.errorText}>{editValueError.first_name}</Text>
                    : null
                  }
                  <TextInput
                    value={editValue?.last_name}
                    onChangeText={(txt) => {
                        setEditValue(prev => ({ ...prev, last_name: txt}));
                        setEditValueError(prev => ({ ...prev, last_name: ""}));
                    }}
                    style={common.modalCardTextInput}
                    placeholder="Apellido"
                    placeholderTextColor={t.text}
                  />
                  {
                    editValueError?.last_name
                    ? <Text style={common.errorText}>{editValueError.last_name}</Text>
                    : null
                  }
                </>
              ) : (
                <>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    style={common.modalCardTextInput}
                    placeholder={editField === "phone" ? "Sin teléfono..." : formatFieldName(editField)}
                    placeholderTextColor={t.text}
                  />
                  {
                    editValueError
                    ? <Text style={common.errorText}>{editValueError}</Text>
                    : null
                  }
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
