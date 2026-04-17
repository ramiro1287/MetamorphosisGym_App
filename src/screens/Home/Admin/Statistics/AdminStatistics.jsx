import React, { useContext, useState, useCallback } from "react";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import PickerSelect from "../../../../components/Picker/PickerSelect";
import DatePickerModal from "../../../../components/Picker/DatePickerModal";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { MonthsMap } from "../../../../constants/payments"
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { getFinalAmount } from "../../../../utils/formatters";
import {
  PayStatusCompleted, PayStatusPending, PayStatusCanceled,
  PayStatusProcessing
} from "../../../../constants/payments";

const PAGE_SIZE = 10;

export default function AdminStatistics() {
  const route = useRoute();
  const { queryDateParam, paymentStatusParam } = route.params || {
    queryDateParam: new Date().toISOString(),
    paymentStatusParam: PayStatusPending
  };

  const [earnings, setEarnings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(paymentStatusParam);
  const [queryDate, setQueryDate] = useState(new Date(queryDateParam));
  const [showPicker, setShowPicker] = useState(false);

  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);       // primera carga / recarga
  const [loadingMore, setLoadingMore] = useState(false); // paginación
  const [connectionError, setConnectionError] = useState(false);

  const navigation = useNavigation();
  const { isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  // ---- helpers
  const buildPaymentsQuery = () => {
    const q = new URLSearchParams();
    q.append("date", queryDate.toISOString());
    q.append("status", paymentStatus);
    q.append("page_size", String(PAGE_SIZE));
    return q.toString();
  };

  const getEarnings = async () => {
    try {
      const query = new URLSearchParams();
      query.append("date", queryDate.toISOString());
      const response = await fetchWithAuth(`/admin/payments/earnings/?${query.toString()}`);
      if (response.ok) {
        const { data } = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const getPayments = async ({ url, append = false } = {}) => {
    try {
      const base = "/admin/payments/";
      const finalUrl = url ?? `${base}?${buildPaymentsQuery()}`;

      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json(); // { results, next, ... }
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

  // Carga de earnings cuando cambia la fecha
  useFocusEffect(
    useCallback(() => {
      setConnectionError(false);
      getEarnings();
    }, [queryDate])
  );

  // Primera carga + recarga cuando cambian filtros (status/fecha)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        setConnectionError(false);
        setLoading(true);
        try { if (isMounted) await getPayments({ append: false }); }
        finally { if (isMounted) setLoading(false); }
      })();
      return () => { isMounted = false; };
    }, [paymentStatus, queryDate])
  );

  const handleLoadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try { await getPayments({ url: nextUrl, append: true }); }
    finally { setLoadingMore(false); }
  };

  const onConfirmDate = (selectedDate) => {
    setQueryDate(selectedDate);
    setShowPicker(false);
  };

  const handlePaymentDetail = (payment) => {
    navigation.reset({
      index: 4,
      routes: [
        { name: "Home" },
        { name: "AdminStatistics", params: { queryDateParam: queryDate.toISOString(), paymentStatusParam: paymentStatus } },
        { name: "AdminUserPaymentDetail", params: { paymentId: payment.id, fullName: payment.user_fullname } },
      ]
    });
  };

  const handleNotifyUser = async (paymentId) => {
    const confirm = await showConfirmModalAlert("¿Quieres notificar la falta de pago de esta cuota?");
    if (!confirm) return;

    try {
      const response = await fetchWithAuth("/admin/notifications/notify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notif_key: "PAYMENT_REMINDER", payment_id: paymentId }),
      });
      if (response.ok) {
        toastSuccess("Notificación enviada");
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
      }
    } catch {
      toastError("Error", "Error de conexión");
    }
  };

  const handleRetry = async () => {
    setConnectionError(false);
    setLoading(true);
    try {
      await Promise.all([getEarnings(), getPayments({ append: false })]);
    } finally {
      setLoading(false);
    }
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;

  const styles = StyleSheet.create({
    rowTitle: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContainer: {
      backgroundColor: t.secondBackground,
      borderRadius: 20,
      padding: 15,
      alignItems: "center",
      width: "100%",
    },
  });

  return (
    <View style={{ flex: 1, padding: 20, paddingHorizontal: 40 }}>
      <Text style={common.titleText}>Estadísticas</Text>

      <View style={styles.cardContainer}>
        <View style={common.infoRow}>
          <Text style={common.label}>
            Ingresos {MonthsMap[queryDate.getUTCMonth() + 1]} {queryDate.getFullYear()}
          </Text>
          <Icon
            name="edit-calendar"
            size={25}
            color={t.icon}
            onPress={() => setShowPicker(true)}
            style={common.touchableIconContainer}
          />
        </View>

        <View style={common.infoRow}>
          <Text style={common.label}>Ganancias</Text>
          <Text style={common.value}>$ {earnings?.payments_completed_total}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Pendientes</Text>
          <Text style={common.value}>$ {earnings?.payments_pending_total}</Text>
        </View>
        <View style={common.infoRow}>
          <Text style={common.label}>Cancelados</Text>
          <Text style={common.value}>$ {earnings?.payments_canceled_total}</Text>
        </View>
      </View>

      <DatePickerModal
        visible={showPicker}
        value={queryDate}
        onConfirm={onConfirmDate}
        onCancel={() => setShowPicker(false)}
        minimumDate={new Date(2025, 0, 1)}
      />

      <View style={styles.rowTitle}>
        <Text style={[common.titleText, { marginTop: 20 }]}>Cuotas </Text>
        <PickerSelect
          value={paymentStatus}
          onValueChange={(v) => setPaymentStatus(v)}
          items={[
            { label: "Pagadas", value: PayStatusCompleted },
            { label: "Pendientes/Procesando", value: PayStatusPending },
            { label: "Canceladas", value: PayStatusCanceled },
          ]}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollContainer
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        loadingMore={loadingMore}
        ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
      >
        {loading && !payments.length ? (
          <ActivityIndicator />
        ) : payments.length ? (
          payments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={[common.cardContainerBordered, { marginBottom: 15 }]}
              onPress={() => handlePaymentDetail(payment)}
            >
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Usuario:</Text>
                <Text style={common.cardRowText}>{payment.user_fullname}</Text>
              </View>
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Monto a pagar:</Text>
                <Text style={common.cardRowText}>${getFinalAmount(payment)}</Text>
                {paymentStatus === PayStatusPending && (
                  <Icon
                    name="forward-to-inbox"
                    size={25}
                    color={t.icon}
                    onPress={() => handleNotifyUser(payment.id)}
                    style={[common.touchableIconContainer, { padding: 12, marginLeft: 5 }]}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={common.value}>Sin Cuotas</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
