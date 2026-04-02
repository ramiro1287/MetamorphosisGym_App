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
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import {
  PayStatusCanceled, PayStatusCompleted,
} from "../../../../constants/payments";
import {
  buttonTextConfirmDark, inputErrorDark,
} from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { formatPaymentStatus, getFinalAmount, getMonth } from "../../../../utils/formatters";

const PAGE_SIZE = 10;

export default function AdminUserPayments() {
  const [payments, setPayments] = useState([]);
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
      const base = `/admin/payments/user/${idNumber}/`;
      const finalUrl = url ?? `${base}?${buildQuery()}`;

      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json();
      setNextUrl(data.next ?? null);
      setPayments(prev => (append ? [...prev, ...data.results] : data.results));
    } catch (error) {
      if (error.message === 'Network request failed') {
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

  const handleRetry = async () => {
    setConnectionError(false);
    setLoading(true);
    try { await fetchPage({ append: false }); }
    finally { setLoading(false); }
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 20,
      color: t.text,
      marginVertical: 20,
      alignSelf: "center",
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
                      : { color: inputErrorDark }
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
          <Text style={styles.titleText}>Sin cuotas...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
