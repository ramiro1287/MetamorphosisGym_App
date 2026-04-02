
import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError } from "../../../../components/Toast/Toast";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";

export default function AdminFamilies() {
  const [families, setFamilies] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(
    useCallback(() => {
      setConnectionError(false);
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
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
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

  const handleCreateFamily = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Home" },
        { name: "AdminFamilies" },
        { name: "AdminFamilyCreate" }
      ]
    });
  };

  const handleRetry = () => {
    setConnectionError(false);
    loadFamilies();
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;
 
  const styles = StyleSheet.create({
    cardRowContainer: {
      flexDirection: "row",
      marginBottom: 5,
    },
    cardRowTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: t.secondText,
      marginRight: 6,
    },
    cardRowText: {
      fontSize: 20,
      color: t.text,
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={common.titleText}>Familias</Text>
      <TouchableButton
        title="Nueva Familia"
        onPress={handleCreateFamily}
        style={[common.createButton, { marginBottom: 20 }]}
      />
      <ScrollContainer>
        {families.length ? families.map((family) => (
          <TouchableOpacity
            key={family.id}
            onPress={() => handleFamilyDetail(family.id)}
            style={common.cardContainerBordered}
          >
            <View style={styles.cardRowContainer}>
              <Text style={styles.cardRowTitle}>Nombre:</Text>
              <Text style={styles.cardRowText}>{family.name}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <Text style={common.titleText}>Sin familias...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
