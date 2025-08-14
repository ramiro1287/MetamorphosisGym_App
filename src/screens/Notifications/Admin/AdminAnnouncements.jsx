import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { GymContext } from "../../../context/GymContext";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../services/authService";
import { toastError } from "../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../components/Alerts/ConfirmModalAlert";
import TouchableButton from "../../../components/Buttons/TouchableButton";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
} from "../../../constants/UI/colors";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const { isDarkMode, getHasUnreadNotifications } = useContext(GymContext);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadAnnouncements();
    }, [])
  );

  const loadAnnouncements = async () => {
    try {
      const response = await fetchWithAuth("/admin/notifications/annoucements/");
      if (response.ok) {
        const { data } = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleDeleteAnnouncement = async (idNumber) => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de eliminar el anuncio?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/notifications/annoucements/delete/${idNumber}/`,
        { method: "DELETE" }
      );
      if (response.ok) {
        loadAnnouncements();
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleCreateAnnouncements = async () => {
    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de crear el anuncio?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        "/admin/notifications/annoucements/",
        { method: "POST" }
      );
      if (response.ok) {
        loadAnnouncements();
        getHasUnreadNotifications();
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleCreateAnnouncement = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "AdminAnnouncements" },
        { name: "AdminAnnouncementCreate" }
      ]
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 25,
    },
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
      padding: 10,
      width: "100%",
      marginBottom: 20,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      flex: 1,
      marginRight: 10,
    },
    cardDescription: {
      fontSize: 16,
      color: isDarkMode ? secondTextDark : secondTextLight,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardDate: {
      fontSize: 14,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    iconButton: {
      marginLeft: 10,
    },
    createButton: {
      alignSelf: "flex-end",
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Anuncios</Text>
      <TouchableButton
        title="Nuevo Anuncio"
        onPress={handleCreateAnnouncement}
        style={styles.createButton}
      />
      <ScrollContainer style={{ marginTop: 20 }}>
        {announcements.length ? announcements.map((annc) => (
          <View
            key={annc.id}
            style={styles.cardContainer}
          >
            <View style={styles.cardFooter}>
              <Text style={styles.cardTitle}>{annc.title}</Text>
            </View>

            <Text style={styles.cardDescription}>{annc.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>
                Expira el: {formatDate(annc.expiration_date)}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteAnnouncement(annc.id)}
                style={styles.iconButton}
              >
                <Icon
                  name="delete"
                  size={24}
                  color={isDarkMode ? defaultTextDark : defaultTextLight}
                />
              </TouchableOpacity>
            </View>
          </View>
        )) : (
          <Text style={styles.titleText}>Sin anuncios...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
