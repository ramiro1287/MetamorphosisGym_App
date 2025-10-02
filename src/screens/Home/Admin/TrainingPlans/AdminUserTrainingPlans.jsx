import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastInfo } from "../../../../components/Toast/Toast";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import { PlanStatusActive } from "../../../../constants/trainingPlans";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark,
  secondTextDark, secondTextLight,
} from "../../../../constants/UI/colors";

const PAGE_SIZE = 10;

export default function AdminUserTrainingPlans() {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { idNumber, fullName } = route.params || {};

  const buildQuery = () => {
    const q = new URLSearchParams();
    q.append("page_size", String(PAGE_SIZE));
    return q.toString();
  };

  const fetchPage = async ({ url, append = false } = {}) => {
    try {
      const base = `/admin/training-plans/list/${idNumber}/`;
      const finalUrl = url ?? `${base}?${buildQuery()}`;

      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json();
      setNextUrl(data.next ?? null);
      setTrainingPlans(prev => (append ? [...prev, ...data.results] : data.results));
    } catch (err) {
      toastError("Error", "Error de conexión");
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        setLoading(true);
        try { if (isMounted) await fetchPage({ append: false }); }
        finally { if (isMounted) setLoading(false); }
      })();
      return () => { isMounted = false; };
    }, [idNumber])
  );

  const handleLoadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try { await fetchPage({ url: nextUrl, append: true }); }
    finally { setLoadingMore(false); }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Sin vencimiento";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  };

  const handlePlanDetail = (planId) => {
    navigation.reset({
      index: 4,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserDetail", params: { idNumber } },
        { name: "AdminUserTrainingPlans", params: { idNumber, fullName } },
        { name: "AdminUserTrainingPlanDetail", params: { idNumber, planId, fullName } },
      ]
    });
  };

  const handleCreateTrainingPlan = () => {
    const activePlan = trainingPlans.some(p => p.status === PlanStatusActive);
    if (activePlan) {
      toastInfo("Ya existe un plan activo");
      return;
    }
    navigation.reset({
      index: 4,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserDetail", params: { idNumber } },
        { name: "AdminUserTrainingPlans", params: { idNumber, fullName } },
        { name: "AdminUserTrainingPlanCreate", params: { idNumber, fullName } },
      ]
    });
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginTop: 20,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 15,
      width: "100%",
      marginBottom: 20,
      borderRightWidth: 3,
      borderLeftWidth: 3,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    cardRowContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    cardRowTitle: {
      fontSize: 16,
      color: isDarkMode ? secondTextDark : secondTextLight,
      marginRight: 6,
      flexShrink: 1,
    },
    cardRowText: {
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginLeft: 6,
      flex: 1,
      flexShrink: 1,
    },
    addButton: {
      alignSelf: "flex-end",
      marginVertical: 20,
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Planes de {fullName}</Text>
      <TouchableButton title="Agregar plan" onPress={handleCreateTrainingPlan} style={styles.addButton} />

      <ScrollContainer
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        loadingMore={loadingMore}
        ListFooterComponent={loadingMore ? <LoadingScreen /> : null}
      >
        {loading && !trainingPlans.length ? (
          <ActivityIndicator />
        ) : trainingPlans.length ? (
          trainingPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.cardContainer,
                plan.status === PlanStatusActive && { borderColor: buttonTextConfirmDark }
              ]}
              onPress={() => handlePlanDetail(plan.id)}
            >
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Entrenador:</Text>
                <Text style={styles.cardRowText}>{plan.coach}</Text>
              </View>
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Fecha de expiración:</Text>
                <Text style={styles.cardRowText}>{formatDate(plan.expiration_date)}</Text>
              </View>
              {plan.description ? (
                <View style={styles.cardRowContainer}>
                  <Text style={styles.cardRowTitle}>Anotaciones:</Text>
                  <Text style={styles.cardRowText}>{plan.description}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.titleText}>Sin planes...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
