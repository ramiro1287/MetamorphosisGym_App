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
import { getThemeColors, getCommonStyles } from "../../constants/UI/theme";
import { formatDate } from "../../utils/formatters";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { isDarkMode, getHasUnreadNotifications } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

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
      <Text style={common.titleText}>Notificaciones</Text>
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
                      color={t.text}
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
                    color={t.text}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        }) : (
          <Text style={common.titleText}>Sin notificaciones...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
