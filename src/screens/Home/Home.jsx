import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import TouchableButton from "../../components/Buttons/TouchableButton";
import ScrollContainer from "../../components/Containers/ScrollContainer";
import LoadingScreen from "../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../components/NoConnection/NoConnectionScreen";
import { GymContext } from "../../context/GymContext";
import { fetchWithAuth } from "../../services/authService";
import { toastError } from "../../components/Toast/Toast";
import { TraineeRole, AdminRole } from "../../constants/users";
import { PayStatusCompleted } from "../../constants/payments";
import { buttonTextConfirmDark, inputErrorDark } from "../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../constants/UI/theme";
import { formatDate, formatPaymentStatus, getFinalAmount, getMonth } from "../../utils/formatters";

export default function Home() {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode, user, gymInfo } = useContext(GymContext);
  const navigation = useNavigation();

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setConnectionError(false);
      await Promise.all([loadTrainingPlan(), loadPayments()]);
      setLoading(false);
    };
    load();
  }, []));

  const loadTrainingPlan = async () => {
    try {
      const response = await fetchWithAuth("/training-plans/list/");
      if (response.ok) {
        const { data } = await response.json();
        setTrainingPlans(data["results"]);
      }
    } catch (error) {
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const loadPayments = async () => {
    if (user.role !== TraineeRole) return;
    try {
      const response = await fetchWithAuth("/payments/list/");
      if (response.ok) {
        const { data } = await response.json();
        setPayments(data["results"]);
      }
    } catch (error) {
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const handleRetry = async () => {
    setConnectionError(false);
    setLoading(true);
    await Promise.all([loadTrainingPlan(), loadPayments()]);
    setLoading(false);
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;
  if (loading) return <LoadingScreen />;

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const styles = StyleSheet.create({
    container: { padding: 25, gap: 15 },
    welcomeText: {
      fontSize: 26,
      fontWeight: "bold",
      color: t.text,
    },
    card: {
      width: "100%",
      backgroundColor: t.secondBackground,
      borderRadius: 16,
      padding: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
      color: t.text,
    },
    noDataText: {
      fontSize: 16,
      color: t.text,
    },
    adminGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    adminGridItem: {
      width: "40%",
      backgroundColor: t.buttonBackground,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: "center",
      gap: 8,
    },
    adminGridItemText: {
      color: t.buttonText,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
  });

  return (
    <ScrollContainer style={styles.container}>
      <Text style={styles.welcomeText}>¡Hola {user?.first_name || "usuario"}!</Text>

      {user.role === TraineeRole && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Última cuota</Text>
          {payments.length ? (
            <>
              <View style={common.infoRow}>
                <Text style={common.label}>Precio</Text>
                <Text style={[
                  common.value,
                  { fontSize: 22, fontWeight: "bold" }
                ]}>
                  ${getFinalAmount(payments[0])}
                </Text>
              </View>
              <View style={common.infoRow}>
                <Text style={common.label}>Estado</Text>
                <Text
                  style={[
                    common.value,
                    { color: payments[0].status !== PayStatusCompleted ? inputErrorDark : buttonTextConfirmDark }
                  ]}
                >
                  {formatPaymentStatus(payments[0].status)}
                </Text>
              </View>
              <View style={common.infoRow}>
                <Text style={common.label}>Mes</Text>
                <Text style={common.value}>
                  {getMonth(payments[0].created_at)} {new Date(payments[0].created_at).getFullYear()}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <TouchableButton
                  title="Ver cuotas"
                  icon={<Icon name="credit-card" size={22} color={t.buttonText} />}
                  onPress={() => navigation.navigate("TraineePayments")}
                />
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>Sin cuotas disponibles</Text>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan de entrenamiento</Text>
        {trainingPlans.length ? (
          <>
            <View style={common.infoRow}>
              <Text style={common.label}>Entrenador</Text>
              <Text style={common.value}>{trainingPlans[0].coach}</Text>
            </View>
            <View style={common.infoRow}>
              <Text style={common.label}>Vence</Text>
              <Text style={common.value}>
                {formatDate(trainingPlans[0].expiration_date, "Sin vencimiento")}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <TouchableButton
                title="Ver plan"
                icon={<Icon name="clipboard" size={22} color={t.buttonText} />}
                onPress={() => navigation.navigate("TraineePlans")}
              />
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>Sin plan asignado</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planes y Precios</Text>
        {gymInfo?.plans?.length ? (
          gymInfo.plans.map(plan => (
            <View key={plan.id} style={common.infoRow}>
              <Text style={common.label}>{plan.name}</Text>
              <Text style={common.value}>
                ${plan.price}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No hay planes disponibles</Text>
        )}
      </View>

      {user.role !== TraineeRole && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Administración</Text>
          <View style={styles.adminGrid}>
            {[
              { title: "Usuarios", icon: "users", route: "AdminUsers", show: true },
              { title: "Familias", icon: "home", route: "AdminFamilies", show: user.role === AdminRole },
              { title: "Ejercicios", icon: "activity", route: "AdminExercises", show: user.role === AdminRole },
              { title: "Planes Mensuales", icon: "calendar", route: "AdminUserPlans", show: user.role === AdminRole },
              { title: "Estadísticas", icon: "bar-chart-2", route: "AdminStatistics", show: user.role === AdminRole },
              { title: "Planes Entrenamiento", icon: "clipboard", route: "AdminTrainingPlans", show: user.role === AdminRole },
              { title: "Anuncios", icon: "message-square", route: "AdminAnnouncements", show: user.role === AdminRole },
            ]
              .filter(item => item.show)
              .map(item => (
                <TouchableOpacity
                  key={item.route}
                  style={styles.adminGridItem}
                  onPress={() => navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: item.route }] })}
                >
                  <Icon name={item.icon} size={28} color={t.buttonText} />
                  <Text style={styles.adminGridItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}
    </ScrollContainer>
  );
}
