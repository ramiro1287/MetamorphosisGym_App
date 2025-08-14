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
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondTextDark, secondTextLight,
  secondBackgroundDark, secondBackgroundLight,
  inputErrorDark, inputErrorLight,
} from "../../../../constants/UI/colors";

export default function AdminUserDetail() {
  const [userDetail, setUserDetail] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [editValueError, setEditValueError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const { isDarkMode, gymInfo, user } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  };

  const formatRole = (role) => {
    if (role === AdminRole) return "Administrador";
    if (role === CoachRole) return "Entrenador";
    return "Cliente";
  };

  const formatStatus = (status) => {
    if (status === StatusDeleted) return "Inactivo";
    return "Activo";
  };

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
      profileCard: {
        backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        width: "100%",
      },
      avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
      },
      userName: {
        fontSize: 22,
        fontWeight: "bold",
        color: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      userId: {
        fontSize: 16,
        color: isDarkMode ? secondTextDark : secondTextLight,
        marginBottom: 20,
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
        borderColor: isDarkMode ?  defaultTextDark : defaultTextLight,
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
      pickerSelect: {
        inputIOS: {
          fontSize: 18,
          color: isDarkMode ? defaultTextDark : defaultTextLight,
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderRadius: 20,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
        },
        inputAndroid: {
          fontSize: 18,
          color: isDarkMode ? defaultTextDark : defaultTextLight,
          borderWidth: 1,
          borderRadius: 20,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
        },
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
      buttonsCardContainer: {
        backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
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
      <View style={styles.profileCard}>
        <Icon
          name="account-circle"
          size={120}
          color={isDarkMode ? iconDark : iconLight}
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
                color={isDarkMode ? iconDark : iconLight}
                onPress={() => handleEditionModal("full_name")}
                style={{ marginLeft: 5 }}
              />
            ) : null
          }
        </View>
        <Text style={styles.userId}>{userDetail.id_number}</Text>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Rol</Text>
            {user.role === AdminRole && user.id_number !== userDetail.id_number ? (
              <Icon
                name="edit"
                size={22}
                color={isDarkMode ? iconDark : iconLight}
                onPress={() => handleEditionModal("role")}
                style={{ marginLeft: 5 }}
              />
            ): null}
          </View>
          <Text style={styles.value}>{formatRole(userDetail.role)}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Estado</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole && user.id_number !== userDetail.id_number ? (
                <Icon
                  name="edit"
                  size={22}
                  color={isDarkMode ? iconDark : iconLight}
                  onPress={() => handleEditionModal("status")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text
            style={[
                styles.value,
                userDetail.status === StatusDeleted && { color: inputErrorDark }
            ]}
          >
            {formatStatus(userDetail.status)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Plan</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole ? (
                <Icon
                  name="edit"
                  size={22}
                  color={isDarkMode ? iconDark : iconLight}
                  onPress={() => handleEditionModal("plan")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text style={styles.value}>
            {userDetail.plan ? userDetail.plan?.name : "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Jubilado</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole ? (
                <Icon
                  name="edit"
                  size={22}
                  color={isDarkMode ? iconDark : iconLight}
                  onPress={() => handleEditionModal("is_retired")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text style={styles.value}>{userDetail.is_retired ? "Si" : "No"}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.label}>Teléfono</Text>
            {
              (user.role === CoachRole && userDetail.role === TraineeRole)
              || user.role === AdminRole ? (
                <Icon
                  name="edit"
                  size={22}
                  color={isDarkMode ? iconDark : iconLight}
                  onPress={() => handleEditionModal("phone")}
                  style={{ marginLeft: 5 }}
                />
              ) : null
            }
          </View>
          <Text style={styles.value}>
            {userDetail.phone ? userDetail.phone : "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Familia</Text>
          <Text style={styles.value}>
            {userDetail.family ? userDetail.family?.name : "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Dirección</Text>
          <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
            {
              userDetail.address
              ? `${userDetail.address?.address} ${userDetail.address?.city} ${userDetail.address?.state}`
              : "N/A"
            }
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nacimiento</Text>
          <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
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
          <View style={styles.modalContainer}>
            <View style={styles.modalCardContainer}>
              <Text style={styles.modalCardTitle}>
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
                  style={styles.pickerSelect}
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
                  style={styles.pickerSelect}
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
                  style={styles.pickerSelect}
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
                  style={styles.pickerSelect}
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
                    style={styles.modalCardTextInput}
                    placeholder="Nombre"
                    placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                  {
                    editValueError?.first_name
                    ? <Text style={styles.errorText}>{editValueError.first_name}</Text>
                    : null
                  }
                  <TextInput
                    value={editValue?.last_name}
                    onChangeText={(txt) => {
                        setEditValue(prev => ({ ...prev, last_name: txt}));
                        setEditValueError(prev => ({ ...prev, last_name: ""}));
                    }}
                    style={styles.modalCardTextInput}
                    placeholder="Apellido"
                    placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                  {
                    editValueError?.last_name
                    ? <Text style={styles.errorText}>{editValueError.last_name}</Text>
                    : null
                  }
                </>
              ) : (
                <>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    style={styles.modalCardTextInput}
                    placeholder={editField === "phone" ? "Sin teléfono..." : formatFieldName(editField)}
                    placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                  {
                    editValueError
                    ? <Text style={styles.errorText}>{editValueError}</Text>
                    : null
                  }
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
