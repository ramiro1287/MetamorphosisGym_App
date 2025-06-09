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
import {
  PayStatusCanceled, PayStatusCompleted,
  PayStatusPending, PayStatusProcessing,
  MonthsMap,
} from "../../constants/payments";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark, inputErrorDark,
  secondTextDark, secondTextLight,
} from "../../constants/UI/colors";

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

  const formatPaymentStatus = (status) => {
    const map = {
      [PayStatusPending]: "Pendiente",
      [PayStatusCompleted]: "Pagada",
      [PayStatusCanceled]: "Cancelada",
      [PayStatusProcessing]: "Procesando"
    };
    return map[status] || "Error";
  };

  const getFinalAmount = (payment) => {
    const final = parseFloat(payment.total_amount) +
      parseFloat(payment.penalties_sum) -
      parseFloat(payment.discounts_sum);
    return final.toFixed(2);
  };

  const getMonth = (dateString) => {
    const date = new Date(dateString);
    return MonthsMap[date.getMonth() + 1];
  };

  const formatDate = (iso) => {
    if (!iso) return "Sin vencimiento";
    const date = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  };

  if (loading) return <LoadingScreen />;

  const styles = StyleSheet.create({
    container: { padding: 20, gap: 20 },
    welcomeText: {
      fontSize: 26,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    card: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 16,
      padding: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    info: {
      fontSize: 16,
      marginBottom: 6,
      color: isDarkMode ? secondTextDark : secondTextLight,
    },
    status: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 4,
    },
    price: {
      fontSize: 24,
      fontWeight: "bold",
      marginVertical: 8,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    noDataText: {
      fontSize: 16,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    buttonsSelectorContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: 30,
      gap: 20,
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
              <Text
                style={[
                  styles.status,
                  { color: payments[0].status !== PayStatusCompleted ? inputErrorDark : buttonTextConfirmDark }
                ]}
              >
                {formatPaymentStatus(payments[0].status)}
              </Text>
              <Text style={styles.price}>${getFinalAmount(payments[0])}</Text>
              <Text style={styles.info}>
                Mes: {getMonth(payments[0].created_at)} {new Date(payments[0].created_at).getFullYear()}
              </Text>
              <TouchableButton
                title="Ver cuotas"
                icon={<Icon name="credit-card" size={22} color={isDarkMode ? defaultTextLight : defaultTextDark} />}
                onPress={() => navigation.navigate("TraineePayments")}
              />
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
            <Text style={styles.info}>Entrenador: {trainingPlans[0].coach}</Text>
            <Text style={styles.info}>Vence: {formatDate(trainingPlans[0].expiration_date)}</Text>
            <TouchableButton
              title="Ver plan"
              icon={<Icon name="clipboard" size={22} color={isDarkMode ? defaultTextLight : defaultTextDark} />}
              onPress={() => navigation.navigate("TraineePlans")}
            />
          </>
        ) : (
          <Text style={styles.noDataText}>Sin plan asignado</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planes y Precios</Text>
        {gymInfo?.plans?.length ? (
          gymInfo.plans.map(plan => (
            <Text key={plan.id} style={styles.info}>
              {plan.name}: ${plan.price}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>No hay planes disponibles</Text>
        )}
      </View>

      {user.role !== TraineeRole && (
        <View style={styles.buttonsSelectorContainer}>
          <TouchableButton
            title="Usuarios"
            icon={<Icon name="users" size={22} color={isDarkMode ? defaultTextLight : defaultTextDark} />}
            onPress={() => navigation.navigate("AdminUsers")}
          />
          {user.role === AdminRole && (
            <>
              <TouchableButton
                title="Familias"
                icon={<Icon name="home" size={22} color={isDarkMode ? defaultTextLight : defaultTextDark} />}
                onPress={() => navigation.navigate("AdminFamilies")}
              />
              <TouchableButton
                title="Planes Mensuales"
                icon={<Icon name="calendar" size={22} color={isDarkMode ? defaultTextLight : defaultTextDark} />}
                onPress={() => navigation.navigate("AdminUserPlans")}
              />
              <TouchableButton
                title="Estadísticas"
                icon={<Icon name="bar-chart-2" size={22} color={isDarkMode ? defaultTextLight : defaultTextDark} />}
                onPress={() => navigation.navigate("AdminStatistics")}
              />
            </>
          )}
        </View>
      )}
    </ScrollContainer>
  );
}
