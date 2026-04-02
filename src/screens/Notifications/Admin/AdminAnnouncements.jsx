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
import NoConnectionScreen from "../../../components/NoConnection/NoConnectionScreen";
import { showConfirmModalAlert } from "../../../components/Alerts/ConfirmModalAlert";
import TouchableButton from "../../../components/Buttons/TouchableButton";
import { getThemeColors, getCommonStyles } from "../../../constants/UI/theme";
import { formatDate } from "../../../utils/formatters";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode, getHasUnreadNotifications } = useContext(GymContext);
  const navigation = useNavigation();
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(
    useCallback(() => {
      setConnectionError(false);
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
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
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

  const handleRetry = () => {
    setConnectionError(false);
    loadAnnouncements();
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 25,
    },
    cardContainer: {
      backgroundColor: t.secondBackground,
      borderColor: t.text,
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
      color: t.text,
      flex: 1,
      marginRight: 10,
    },
    cardDescription: {
      fontSize: 16,
      color: t.secondText,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardDate: {
      fontSize: 14,
      color: t.text,
    },
    iconButton: {
      marginLeft: 10,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={common.titleText}>Anuncios</Text>
      <TouchableButton
        title="Nuevo Anuncio"
        onPress={handleCreateAnnouncement}
        style={common.createButton}
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
                  color={t.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        )) : (
          <Text style={common.titleText}>Sin anuncios...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
