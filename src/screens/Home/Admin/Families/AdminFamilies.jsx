import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError } from "../../../../components/Toast/Toast";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
} from "../../../../constants/UI/colors";

export default function AdminFamilies() {
  const [families, setFamilies] = useState([]);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadFamilies();
    }, [])
  );

  const loadFamilies = async () => {
    try {
      const response = await fetchWithAuth("/admin/users/family/");
      if (response.ok) {
        const { data } = await response.json();
        setFamilies(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleFamilyDetail = (familyId) => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Home" },
        { name: "AdminFamilies" },
        { name: "AdminFamilyDetail", params: { familyId } }
      ]
    });
  };
 
  const styles = StyleSheet.create({
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
      padding: 15,
      width: "100%",
      marginBottom: 20,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    cardRowContainer: {
      flexDirection: "row",
      marginBottom: 5,
    },
    cardRowTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? secondTextDark : secondTextLight,
      marginRight: 6,
    },
    cardRowText: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Familias</Text>
      <ScrollContainer>
        {families.length ? families.map((family) => (
          <TouchableOpacity
            key={family.id}
            onPress={() => handleFamilyDetail(family.id)}
            style={styles.cardContainer}
          >
            <View style={styles.cardRowContainer}>
              <Text style={styles.cardRowTitle}>Nombre:</Text>
              <Text style={styles.cardRowText}>{family.name}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <Text style={styles.titleText}>Sin familias...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
