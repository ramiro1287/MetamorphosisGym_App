import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { GymContext } from "../../context/GymContext";
import ScrollContainer from "../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../services/authService";
import { toastError } from "../../components/Toast/Toast";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
} from "../../constants/UI/colors";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { isDarkMode, getHasUnreadNotifications } = useContext(GymContext);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      const response = await fetchWithAuth("/notifications/list/");
      if (response.ok) {
        const { data } = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleDeleteNotification = async (idNumber) => {
    try {
      const response = await fetchWithAuth(
        `/notifications/delete/${idNumber}/`,
        { method: "DELETE" }
      );
      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleReadNotification = async (idNumber) => {
    try {
      const response = await fetchWithAuth(
        `/notifications/read/${idNumber}/`,
        { method: "post" }
      );
      if (response.ok) {
        loadNotifications();
        getHasUnreadNotifications();
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
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
    badge: {
      position: "absolute",
      top: 1,
      right: 1,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "red",
      zIndex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Notificaciones</Text>
      <ScrollContainer style={{ marginTop: 20 }}>
        {notifications.length ? notifications.map((notif) => {
          if (notif.is_read) {
            return (
              <View
                key={notif.id}
                style={styles.cardContainer}
              >
                <View style={styles.cardFooter}>
                  <Text style={styles.cardTitle}>{notif.title}</Text>
                </View>

                <Text style={styles.cardDescription}>{notif.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{formatDate(notif.created_at)}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteNotification(notif.id)}
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
            )
          }
          return (
            <TouchableOpacity
              key={notif.id}
              style={styles.cardContainer}
              onPress={() => handleReadNotification(notif.id)}
            >
              <View style={styles.cardFooter}>
                <Text style={styles.cardTitle}>{notif.title}</Text>
                <View style={styles.badge} />
              </View>

              <Text style={styles.cardDescription}>{notif.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{formatDate(notif.created_at)}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteNotification(notif.id)}
                  style={styles.iconButton}
                >
                  <Icon
                    name="delete"
                    size={24}
                    color={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        }) : (
          <Text style={styles.titleText}>Sin notificaciones...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
