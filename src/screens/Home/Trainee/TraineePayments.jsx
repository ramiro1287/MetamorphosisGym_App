import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
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

export default function TraineePayments() {
  const [payments, setPayments] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [])
  );

  const loadPayments = async (url = "/payments/list/") => {
    try {
      const response = await fetchWithAuth(url);
      if (response.ok) {
        const { data } = await response.json();
        if (url === "/payments/list/") {
          setPayments(data.results);
        } else {
          setPayments(prev => [...prev, ...data.results]);
        }
        setNextPage(data.next);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleLoadMore = async () => {
    if (nextPage && !loadingMore) {
      setLoadingMore(true);
      await loadPayments(nextPage);
      setLoadingMore(false);
    }
  };  

  const formatPaymentStatus = (status) => {
    if (status === PayStatusPending) return "Pendinete";
    if (status === PayStatusCompleted) return "Pagada";
    if (status === PayStatusCanceled) return "Cancelada";
    if (status === PayStatusProcessing) return "Procesando";
    return "Error";
  };

  const getFinalAmount = (payment) => {
    const discounts_sum = parseFloat(payment.discounts_sum);
    const penalties_sum = parseFloat(payment.penalties_sum);
    const final_price = parseFloat(payment.total_amount) + penalties_sum - discounts_sum;
    return final_price.toFixed(2);
  };

  const getMonth = (stringDate) => {
    const date = new Date(stringDate);
    return MonthsMap[date.getMonth() + 1]
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
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {payments.length !== 0 ? payments.map((payment) => (
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
                  [PayStatusCompleted, PayStatusCanceled].includes(payment.status) ? { color: buttonTextConfirmDark } : { color: inputErrorDark }
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
        )) : (
          <Text style={styles.titleText}>Sin cuotas...</Text>
        )}
        {loadingMore && (<LoadingScreen />)}
      </ScrollContainer>
    </View>
  );
}
