import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GymContext } from "../../../context/GymContext";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../services/authService";
import { toastError } from "../../../components/Toast/Toast";
import LoadingScreen from "../../../components/Loading/LoadingScreen";
import {
  PayStatusCanceled, PayStatusCompleted,
  PayStatusPending, PayStatusProcessing,
  MonthsMap,
} from "../../../constants/payments";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark, inputErrorDark,
  secondTextDark, secondTextLight,
} from "../../../constants/UI/colors";

const PAGE_SIZE = 10;

export default function TraineePayments() {
  const [payments, setPayments] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

  const buildQuery = () => {
    const q = new URLSearchParams();
    q.append("page_size", String(PAGE_SIZE));
    return q.toString();
  };

  const fetchPage = async ({ url, append = false } = {}) => {
    try {
      const base = "/payments/list/";
      const finalUrl = url ?? `${base}?${buildQuery()}`;

      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json(); // { results, next, previous, count }
      setNextUrl(data.next ?? null);
      setPayments(prev => (append ? [...prev, ...data.results] : data.results));
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try { await fetchPage({ append: false }); }
        finally { setLoading(false); }
      })();
    }, [])
  );

  const handleLoadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try { await fetchPage({ url: nextUrl, append: true }); }
    finally { setLoadingMore(false); }
  };

  const formatPaymentStatus = (status) => {
    if (status === PayStatusPending) return "Pendiente";
    if (status === PayStatusCompleted) return "Pagada";
    if (status === PayStatusCanceled) return "Cancelada";
    if (status === PayStatusProcessing) return "Procesando";
    return "Error";
  };

  const getFinalAmount = (payment) => {
    const discounts_sum = parseFloat(payment.discounts_sum) || 0;
    const penalties_sum = parseFloat(payment.penalties_sum) || 0;
    const total = parseFloat(payment.total_amount) || 0;
    return (total + penalties_sum - discounts_sum).toFixed(2);
  };

  const getMonth = (stringDate) => {
    const date = new Date(stringDate);
    return MonthsMap[date.getUTCMonth() + 1];
  };

  const handlePaymentDetail = (paymentId) => {
    navigation.navigate("PaymentDetail", { paymentId });
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 20,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 15,
      width: "100%",
      marginBottom: 20,
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
  });

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.titleText}>Lista de cuotas</Text>

      <ScrollContainer
        style={{ paddingHorizontal: 25 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        loadingMore={loadingMore}
        ListFooterComponent={loadingMore ? <LoadingScreen /> : null}
      >
        {loading && !payments.length ? (
          <ActivityIndicator />
        ) : payments.length ? (
          payments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={styles.cardContainer}
              onPress={() => handlePaymentDetail(payment.id)}
            >
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Estado:</Text>
                <Text
                  style={[
                    styles.cardRowText,
                    [PayStatusCompleted, PayStatusCanceled].includes(payment.status)
                      ? { color: buttonTextConfirmDark }
                      : { color: inputErrorDark },
                  ]}
                >
                  {formatPaymentStatus(payment.status)}
                </Text>
              </View>

              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Valor de la cuota:</Text>
                <Text style={styles.cardRowText}>${payment.total_amount}</Text>
              </View>

              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Monto a pagar:</Text>
                <Text style={styles.cardRowText}>${getFinalAmount(payment)}</Text>
              </View>

              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Mes correspondiente:</Text>
                <Text style={styles.cardRowText}>{getMonth(payment.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.titleText}>Sin cuotas...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
