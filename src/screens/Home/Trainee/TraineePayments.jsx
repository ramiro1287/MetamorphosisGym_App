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
} from "../../../constants/payments";
import {
  buttonTextConfirmDark, inputErrorDark,
} from "../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../constants/UI/theme";
import { formatPaymentStatus, getFinalAmount, getMonth } from "../../../utils/formatters";

const PAGE_SIZE = 10;

export default function TraineePayments() {
  const [payments, setPayments] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

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

  const handlePaymentDetail = (paymentId) => {
    navigation.navigate("PaymentDetail", { paymentId });
  };

  const styles = StyleSheet.create({
    titleText: {
      marginBottom: 20,
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Text style={[common.titleText, styles.titleText]}>Lista de cuotas</Text>

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
              style={common.cardContainer}
              onPress={() => handlePaymentDetail(payment.id)}
            >
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Estado:</Text>
                <Text
                  style={[
                    common.cardRowText,
                    [PayStatusCompleted, PayStatusCanceled].includes(payment.status)
                      ? { color: buttonTextConfirmDark }
                      : { color: inputErrorDark },
                  ]}
                >
                  {formatPaymentStatus(payment.status)}
                </Text>
              </View>

              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Valor de la cuota:</Text>
                <Text style={common.cardRowText}>${payment.total_amount}</Text>
              </View>

              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Monto a pagar:</Text>
                <Text style={common.cardRowText}>${getFinalAmount(payment)}</Text>
              </View>

              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Mes correspondiente:</Text>
                <Text style={common.cardRowText}>{getMonth(payment.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[common.titleText, styles.titleText]}>Sin cuotas...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
