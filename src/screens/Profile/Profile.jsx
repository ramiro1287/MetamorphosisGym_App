import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, Platform  } from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import TouchableButton from "../../components/Buttons/TouchableButton";
import { GymContext } from "../../context/GymContext";
import { fetchWithAuth } from "../../services/authService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { toastError, toastSuccess } from "../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../components/Alerts/ConfirmModalAlert";
import ScrollContainer from "../../components/Containers/ScrollContainer";
import { AdminRole, CoachRole, StatusDeleted } from "../../constants/users";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondTextDark, secondTextLight,
  secondBackgroundDark, secondBackgroundLight,
} from "../../constants/UI/colors";

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

  const onChange = async (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de cambiar tu fecha de nacimiento?"
    );
    if (!confirm) {
      if (Platform.OS === "android") setShowPicker(false);
      return;
    }

    handleChangeBirthDate(selectedDate);
    if (Platform.OS === "android") setShowPicker(false);
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
    if (status === StatusDeleted) return "Desactivado";
    return "Activo";
  };

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
      fontSize: 24,
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
    headerRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>

        <View style={styles.profileCard}>
          <View style={styles.headerRow}>
            <Icon
              name={isDarkMode ? "light-mode" : "dark-mode"}
              size={30}
              color={isDarkMode ? iconDark : iconLight}
              onPress={() => setIsDarkMode(!isDarkMode)}
              style={{ marginRight: 10 }}
            />
            <Icon
              name="power-settings-new"
              size={30}
              color={isDarkMode ? iconDark : iconLight}
              onPress={handleButtonLogout}
              style={{ marginLeft: 10 }}
            />
          </View>
          <Icon
            name="account-circle"
            size={120}
            color={isDarkMode ? iconDark : iconLight}
          />
          <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.userId}>{user.id_number}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Rol</Text>
            <Text style={styles.value}>{formatRole(user.role)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.value}>{formatStatus(user.status)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.value}>{user.plan ? user.plan?.name : "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Jubilado</Text>
            <Text style={styles.value}>{user.is_retired ? "Si" : "No"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>{user.phone ? user.phone : "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Familia</Text>
            <Text style={styles.value}>{user.family ? user.family?.name : "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.label}>Dirección</Text>
              <Icon
                name="edit"
                size={25}
                color={isDarkMode ? iconDark : iconLight}
                onPress={handleChangeAddress}
                style={{ marginLeft: 5 }}
              />
            </View>
            <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
              {user.address ? `${user.address?.address} ${user.address?.city} ${user.address?.state}` : "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.label}>Nacimiento</Text>
              <Icon
                name="edit"
                size={25}
                color={isDarkMode ? iconDark : iconLight}
                onPress={() => setShowPicker(true)}
                style={{ marginLeft: 5 }}
              />
            </View>
            <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
              {user.birth_date ? formatDate(user.birth_date) : "N/A"}
            </Text>
          </View>

          {showPicker && (
            <DateTimePicker
              value={user.birth_date ? new Date(user.birth_date) : new Date()}
              mode="date"
              display="spinner"
              onChange={onChange}
              maximumDate={new Date()}
            />
          )}

          <TouchableButton
            title="Cambiar contraseña"
            onPress={handleChangePassword}
            style={{ marginTop: 15 }}
          />
        </View>

    </ScrollContainer>
  );
}
