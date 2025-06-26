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

export default function Navbar () {
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

  const handleProfile = () => {
    const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name;

    if (currentRoute !== "Profile") {
      navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: "Profile" }] });
    }
  }

  const handleHome = () => {
    const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name;

    if (currentRoute !== "Home") {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    }
  }

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
  });

  return (
    <View style={styles.rootContainer}>
      <TouchableOpacity onPress={handleHome}>
        <Text style={styles.title}>Metamorphosis Gym</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleProfile}>
        <Icon
          name="account-circle"
          size={35}
          color={isDarkMode ? iconDark : iconLight}
        />
      </TouchableOpacity>
    </View>
  );
};
