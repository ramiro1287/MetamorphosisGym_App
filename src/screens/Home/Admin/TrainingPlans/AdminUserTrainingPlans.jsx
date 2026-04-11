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
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import { PlanStatusActive } from "../../../../constants/trainingPlans";
import { buttonTextConfirmDark } from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { formatDate } from "../../../../utils/formatters";

const PAGE_SIZE = 10;

export default function AdminUserTrainingPlans() {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { idNumber, fullName } = route.params || {};

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

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
      if (err.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        setConnectionError(false);
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

  const handleRetry = async () => {
    setConnectionError(false);
    setLoading(true);
    try { await fetchPage({ append: false }); }
    finally { setLoading(false); }
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;

  const styles = StyleSheet.create({
    titleText: {
      ...common.titleText,
      fontSize: 20,
      marginTop: 20,
      marginBottom: 0,
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Planes de {fullName}</Text>
      <TouchableButton
        title="Agregar plan"
        onPress={handleCreateTrainingPlan}
        style={{ alignSelf: "flex-end", marginVertical: 20 }}
      />

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
                common.cardContainerBordered,
                plan.status === PlanStatusActive && { borderColor: buttonTextConfirmDark }
              ]}
              onPress={() => handlePlanDetail(plan.id)}
            >
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Entrenador:</Text>
                <Text style={common.cardRowText}>{plan.coach}</Text>
              </View>
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Fecha de expiración:</Text>
                <Text style={common.cardRowText}>{formatDate(plan.expiration_date, "Sin vencimiento")}</Text>
              </View>
              {plan.description ? (
                <View style={common.cardRowContainer}>
                  <Text style={common.cardRowTitle}>Anotaciones Generales:</Text>
                  <Text style={common.cardRowText}>{plan.description.length > 10 ? plan.description.slice(0, 10) + "..." : plan.description}</Text>
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
