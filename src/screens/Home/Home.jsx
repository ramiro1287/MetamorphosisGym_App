import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import TouchableButton from "../../components/Buttons/TouchableButton";
import ScrollContainer from "../../components/Containers/ScrollContainer";
import LoadingScreen from "../../components/Loading/LoadingScreen";
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
  const { isDarkMode, user, gymInfo } = useContext(GymContext);
  const navigation = useNavigation();

  useFocusEffect(useCallback(() => {
    loadTrainingPlan();
    loadPayments();
    setLoading(false);
  }, []));

  const loadTrainingPlan = async () => {
    try {
      const response = await fetchWithAuth("/training-plans/list/");
      if (response.ok) {
        const { data } = await response.json();
        setTrainingPlans(data["results"]);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
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
      toastError("Error", "Error de conexión");
    }
  };

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
        {trainingPlans.length ? trainingPlans.map((plan) => (
          <View key={plan.id}>
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
          </View>
        )) : (
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
        <View style={common.buttonsSelectorContainer}>
          <TouchableButton
            title="Usuarios"
            icon={<Icon name="users" size={22} color={t.buttonText} />}
            onPress={() => navigation.navigate("AdminUsers")}
          />
          {user.role === AdminRole && (
            <>
              <TouchableButton
                title="Familias"
                icon={<Icon name="home" size={22} color={t.buttonText} />}
                onPress={() => navigation.navigate("AdminFamilies")}
              />
              <TouchableButton
                title="Ejercicios"
                icon={<Icon name="activity" size={22} color={t.buttonText} />}
                onPress={() => navigation.navigate("AdminExercises")}
              />
              <TouchableButton
                title="Planes Mensuales"
                icon={<Icon name="calendar" size={22} color={t.buttonText} />}
                onPress={() => navigation.navigate("AdminUserPlans")}
              />
              <TouchableButton
                title="Estadísticas"
                icon={<Icon name="bar-chart-2" size={22} color={t.buttonText} />}
                onPress={() => navigation.navigate("AdminStatistics")}
              />
              <TouchableButton
                title="Anuncios"
                icon={<Icon name="message-square" size={22} color={t.buttonText} />}
                onPress={() => navigation.navigate("AdminAnnouncements")}
              />
            </>
          )}
        </View>
      )}
    </ScrollContainer>
  );
}
