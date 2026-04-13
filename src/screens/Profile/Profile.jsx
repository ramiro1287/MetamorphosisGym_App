import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import DatePickerModal from "../../components/Picker/DatePickerModal";
import TouchableButton from "../../components/Buttons/TouchableButton";
import { GymContext } from "../../context/GymContext";
import { fetchWithAuth } from "../../services/authService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { toastError, toastSuccess } from "../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../components/Alerts/ConfirmModalAlert";
import ScrollContainer from "../../components/Containers/ScrollContainer";
import { getThemeColors, getCommonStyles } from "../../constants/UI/theme";
import { formatDate, formatRole, formatUserStatus } from "../../utils/formatters";

export default function Profile() {
  const [showPicker, setShowPicker] = useState(false);
  const {
    user,
    refreshUser,
    isDarkMode,
    setIsDarkMode,
    handleLogout,
  } = useContext(GymContext);
  const navigation = useNavigation();

  const handleChangePassword = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "Profile" },
        { name: "ChangePassword" }
      ]
    });
  };

  const onConfirmDate = async (selectedDate) => {
    setShowPicker(false);

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de cambiar tu fecha de nacimiento?"
    );
    if (!confirm) return;

    handleChangeBirthDate(selectedDate);
  };

  const handleChangeBirthDate = async (date) => {
    try {
      const response = await fetchWithAuth("/users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth_date: date.toISOString().split("T")[0] }),
      });

      if (response.ok) {
        toastSuccess("Fecha de nacimiento actualizada");
        refreshUser();
      } else {
        toastError("Error", "No se pudo cambiar tu fecha de nacimiento");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  if (!user) return null;

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const handleButtonLogout = async () => {
    const confirm = await showConfirmModalAlert("¿Seguro que quieres cerrar sesión?");
    if (!confirm) return;
    handleLogout();
  };

  const handleChangeAddress = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "Profile" },
        { name: "ChangeAddress" }
      ]
    });
  };

  const styles = StyleSheet.create({
    userName: {
      fontSize: 24,
      fontWeight: "bold",
      color: t.text,
    },
    userId: {
      fontSize: 16,
      color: t.secondText,
      marginBottom: 20,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>

      <View style={common.profileCard}>
        <View style={styles.headerRow}>
          <Icon
            name={isDarkMode ? "light-mode" : "dark-mode"}
            size={30}
            color={t.icon}
            onPress={() => setIsDarkMode(!isDarkMode)}
            style={{ marginRight: 10 }}
          />
          <Icon
            name="power-settings-new"
            size={30}
            color={t.icon}
            onPress={handleButtonLogout}
            style={{ marginLeft: 10 }}
          />
        </View>
        <Icon
          name="account-circle"
          size={120}
          color={t.icon}
        />
        <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.userId}>{user.id_number}</Text>
        <View style={common.infoRow}>
          <Text style={common.label}>Email</Text>
          <Text style={common.value}>{user.email ? user.email : "N/A"}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Rol</Text>
          <Text style={common.value}>{formatRole(user.role)}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Estado</Text>
          <Text style={common.value}>{formatUserStatus(user.status, "Desactivado")}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Plan</Text>
          <Text style={common.value}>{user.plan ? user.plan?.name : "N/A"}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Jubilado</Text>
          <Text style={common.value}>{user.is_retired ? "Si" : "No"}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Teléfono</Text>
          <Text style={common.value}>{user.phone ? user.phone : "N/A"}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Familia</Text>
          <Text style={common.value}>{user.family ? user.family?.name : "N/A"}</Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Dirección</Text>
            <Icon
              name="edit"
              size={25}
              color={t.icon}
              onPress={handleChangeAddress}
              style={{ marginLeft: 5 }}
            />
          </View>
          <Text style={common.value} numberOfLines={2} ellipsizeMode="tail">
            {user.address ? `${user.address?.address} ${user.address?.city} ${user.address?.state}` : "N/A"}
          </Text>
        </View>
        <View style={common.infoRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={common.label}>Nacimiento</Text>
            <Icon
              name="edit"
              size={25}
              color={t.icon}
              onPress={() => setShowPicker(true)}
              style={{ marginLeft: 5 }}
            />
          </View>
          <Text style={common.value} numberOfLines={2} ellipsizeMode="tail">
            {user.birth_date ? formatDate(user.birth_date) : "N/A"}
          </Text>
        </View>

        <DatePickerModal
          visible={showPicker}
          value={user.birth_date ? new Date(user.birth_date) : new Date()}
          onConfirm={onConfirmDate}
          onCancel={() => setShowPicker(false)}
          maximumDate={new Date()}
        />

        <TouchableButton
          title="Cambiar contraseña"
          onPress={handleChangePassword}
          style={{ marginTop: 15 }}
        />
      </View>

    </ScrollContainer>
  );
}
