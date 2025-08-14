import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GymContext } from "../../context/GymContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  navbarBackgroundDark, navbarBackgroundLight,
} from "../../constants/UI/colors";

export default function Navbar() {
  const { isDarkMode, hasUnreadNotifications } = useContext(GymContext);
  const navigation = useNavigation();

  const handleProfile = () => {
    const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name;
    if (currentRoute !== "Profile") {
      navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: "Profile" }] });
    }
  };

  const handleNotifications = () => {
    const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name;
    if (currentRoute !== "Notifications") {
      navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: "Notifications" }] });
    }
  };

  const handleHome = () => {
    const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name;
    if (currentRoute !== "Home") {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    }
  };

  const styles = StyleSheet.create({
    rootContainer: {
      paddingTop: StatusBar.currentHeight || 24,
      height: (StatusBar.currentHeight || 24) + 56,
      backgroundColor: isDarkMode ? navbarBackgroundDark : navbarBackgroundLight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    rightIconsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },
    iconWrapper: {
      position: "relative",
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
    <View style={styles.rootContainer}>
      <TouchableOpacity onPress={handleHome}>
        <Text style={styles.title}>Metamorphosis Gym</Text>
      </TouchableOpacity>

      <View style={styles.rightIconsContainer}>
        <TouchableOpacity onPress={handleNotifications} style={styles.iconWrapper}>
          {hasUnreadNotifications && <View style={styles.badge} />}
          <Icon
            name="notifications"
            size={35}
            color={isDarkMode ? iconDark : iconLight}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleProfile} style={styles.iconWrapper}>
          <Icon
            name="account-circle"
            size={35}
            color={isDarkMode ? iconDark : iconLight}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
