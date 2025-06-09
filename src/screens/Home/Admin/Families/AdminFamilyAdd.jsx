import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondTextDark, secondTextLight,
  secondBackgroundDark, secondBackgroundLight,
} from "../../../../constants/UI/colors";
import debounce from "lodash.debounce";

export default function AdminFamilyAdd() {
  const [family, setFamily] = useState(null);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ first_name: "", last_name: "" });
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();

  useFocusEffect(
    useCallback(() => {
      loadFamily();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const debounced = debounce(loadUsers, 1000);
      debounced();
      return () => debounced.cancel();
    }, [filters])
  );

  const loadUsers = async () => {
    try {
      const query = new URLSearchParams();
      query.append("page_size", "10");
  
      if (filters.first_name) query.append("first_name", filters.first_name);
      if (filters.last_name) query.append("last_name", filters.last_name);
  
      const response = await fetchWithAuth(`/admin/users/list/?${query.toString()}`);
      if (response.ok) {
        const { data } = await response.json();
        setUsers(data.results);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

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

  const handleAddMember = async (user) => {
    const confirm = await showConfirmModalAlert(
      `¿Estás seguro de agregar a ${user.firstName} a la familia?`
    );
    if (!confirm) return;

    const { familyId } = route.params|| {};
    try {
      const response = await fetchWithAuth(
        "/admin/users/family/add-user/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ family_id: familyId, id_number: user.id_number }),
        }
      );

      if (response.ok) {
        navigation.reset({
          index: 3,
          routes: [
            { name: "Home" },
            { name: "AdminFamilies" },
            { name: "AdminFamilyDetail", params: { familyId } },
          ]
        });
        return;
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
        return;
      }
      toastError("Error", "No se pudo agregar el usaurio a la familia");
      return;
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
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
    titleText: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 22,
      fontWeight: 500,
      marginBottom: 15,
    },
    userCardContainer: {
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
    userText: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 18,
      fontWeight: 500,
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? secondTextDark : secondTextLight,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <View style={styles.profileCard}>
        <Text style={styles.titleText}>Agregar miembro a familia</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.value}>{family.name}</Text>
        </View>
      </View>
      <Text style={[styles.titleText, { marginTop: 20 }]}>Usuarios</Text>
      <View style={{ width: "100%", paddingHorizontal: 30, marginBottom: 15 }}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre"
          placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          value={filters.first_name}
          onChangeText={(text) => handleChange("first_name", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Buscar por apellido"
          placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
          value={filters.last_name}
          onChangeText={(text) => handleChange("last_name", text)}
        />
      </View>
      {users.length ? users.map((usr) => (
        <View key={usr.id_number} style={styles.userCardContainer}>
          <Text style={styles.userText}>{usr.first_name} {usr.last_name}</Text>
          <Icon
            name="person-add"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => handleAddMember(usr)}
            style={{ marginLeft: 5 }}
          />
        </View>
      )) : (<Text style={styles.titleText}>No se encontraron usuarios</Text>)}
    </ScrollContainer>
  );
}
