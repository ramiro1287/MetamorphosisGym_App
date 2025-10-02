import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
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
import { toastError } from "../../../../components/Toast/Toast";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import {
  PayStatusCanceled, PayStatusCompleted,
  PayStatusPending, PayStatusProcessing,
  MonthsMap,
} from "../../../../constants/payments";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark, inputErrorDark,
  secondTextDark, secondTextLight,
} from "../../../../constants/UI/colors";

const PAGE_SIZE = 10;

export default function AdminUserPayments() {
  const [payments, setPayments] = useState([]);
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
      const base = `/admin/payments/user/${idNumber}/`;
      const finalUrl = url ?? `${base}?${buildQuery()}`;

      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json();
      setNextUrl(data.next ?? null);
      setPayments(prev => (append ? [...prev, ...data.results] : data.results));
    } catch (error) {
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
    const final_price = (parseFloat(payment.total_amount) || 0) + penalties_sum - discounts_sum;
    return final_price.toFixed(2);
  };

  const getMonth = (stringDate) => {
    const date = new Date(stringDate);
    return MonthsMap[date.getMonth() + 1];
  };

  const handlePaymentDetail = (paymentId) => {
    navigation.reset({
      index: 4,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserDetail", params: { idNumber } },
        { name: "AdminUserPayments", params: { idNumber, fullName } },
        { name: "AdminUserPaymentDetail", params: { paymentId, fullName } },
      ]
    });
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginVertical: 20,
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
      <Text style={styles.titleText}>Cuotas de {fullName}</Text>

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
                      : { color: inputErrorDark }
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
