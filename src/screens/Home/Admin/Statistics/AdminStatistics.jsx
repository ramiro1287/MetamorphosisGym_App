import React, { useContext, useState, useCallback } from "react";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import { GymContext } from "../../../../context/GymContext";
import { fetchWithAuth } from "../../../../services/authService";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { MonthsMap } from "../../../../constants/payments"
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
} from "../../../../constants/UI/colors";
import {
  PayStatusCompleted, PayStatusPending,
  PayStatusCanceled,
} from "../../../../constants/payments";

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
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const navigation = useNavigation();
  const { isDarkMode } = useContext(GymContext);

  useFocusEffect(
    useCallback(() => {
      getEarnings();
    }, [queryDate])
  );

  useFocusEffect(
    useCallback(() => {
      getPayments();
    }, [paymentStatus, queryDate])
  );

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
      toastError("Error", "Error de conexión");
    }
  };

  const getPayments = async (url = "/admin/payments/") => {
    try {
      const query = new URLSearchParams();
      query.append("date", queryDate.toISOString());
      query.append("status", paymentStatus);
      const response = await fetchWithAuth(`${url}?${query.toString()}`);
      if (response.ok) {
        const { data } = await response.json();
        setPayments(data.results);
        if (url === "/admin/payments/") {
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
      await getPayments(nextPage);
      setLoadingMore(false);
    }
  };

  const onChange = async (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    setQueryDate(selectedDate);
    setShowPicker(false);
  };

  const getFinalAmount = (payment) => {
    const discounts_sum = parseFloat(payment.discounts_sum);
    const penalties_sum = parseFloat(payment.penalties_sum);
    const final_price = parseFloat(payment.total_amount) + penalties_sum - discounts_sum;
    return final_price.toFixed(2);
  };

  const handlePaymentDetail = (payment) => {
    navigation.reset({
        index: 4,
        routes: [
          { name: "Home" },
          {
            name: "AdminStatistics",
            params: {
              queryDateParam: queryDate.toISOString(),
              paymentStatusParam: paymentStatus
            }
          },
          {
            name: "AdminUserPaymentDetail",
            params: { paymentId: payment.id, fullName: payment.user_fullname }
          },
        ]
      });
  };

  const handleNotifyUser = async (paymentId) => {
    const confirm = await showConfirmModalAlert(
      "¿Quieres notificar la falta de pago de esta cuota?"
    );
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        "/admin/notifications/notify/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notif_key: "PAYMENT_REMINDER",
            payment_id: paymentId
          }),
        }
      );
      if (response.ok) {
        toastSuccess("Notificacion enviada");
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
        return;
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
      alignSelf: "center",
    },
    rowTitle: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 15,
      alignItems: "center",
      width: "100%",
    },
    rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      alignItems: "flex-start",
      flexWrap: "wrap",
      marginBottom: 10,
    },
    label: {
      color: isDarkMode ? secondTextDark : secondTextLight,
      fontSize: 18,
    },
    value: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: 18,
      flex: 1,
      textAlign: "right",
    },
    pickerSelect: {
      inputIOS: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      inputAndroid: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
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
    <View style={{ flex: 1, padding: 20, paddingHorizontal: 40 }}>
      <Text style={styles.titleText}>Estadísticas</Text>
      <View style={styles.cardContainer}>
        <View style={styles.rowContainer}>
          <Text style={styles.label}>
            Ingresos {MonthsMap[queryDate.getMonth() + 1]} {queryDate.getFullYear()}
          </Text>
          <Icon
            name="edit-calendar"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => setShowPicker(true)}
            style={{ marginLeft: 5 }}
          />
        </View>
        <View style={styles.rowContainer}>
          <Text style={styles.label}>Ganancias</Text>
          <Text style={styles.value}>
            $ {earnings?.payments_completed_total}
          </Text>
        </View>
        <View style={styles.rowContainer}>
          <Text style={styles.label}>Pendientes</Text>
          <Text style={styles.value}>
            $ {earnings?.payments_pending_total}
          </Text>
        </View>
        <View style={styles.rowContainer}>
          <Text style={styles.label}>Cancelados</Text>
          <Text style={styles.value}>
            $ {earnings?.payments_canceled_total}
          </Text>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={queryDate}
          mode="date"
          display="spinner"
          onChange={onChange}
          minimumDate={new Date(2025, 0, 1)}
        />
      )}

      <View style={styles.rowTitle}>
        <Text style={[styles.titleText, { marginTop: 20 }]}>Cuotas </Text>
        <RNPickerSelect
          value={paymentStatus}
          onValueChange={(v) => setPaymentStatus(v)}
          items={[
            { label: "Pagadas", value: PayStatusCompleted, color: defaultTextLight },
            { label: "Pendientes", value: PayStatusPending, color: defaultTextLight },
            { label: "Canceladas", value: PayStatusCanceled, color: defaultTextLight },
          ]}
          style={styles.pickerSelect}
          useNativeAndroidPickerStyle={false}
          placeholder={{}}
        />
      </View>
      <ScrollContainer
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {payments.length ? (
          payments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={[styles.cardContainer, { marginBottom: 15 }]}
              onPress={() => handlePaymentDetail(payment)}
            >
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Usuario:</Text>
                <Text style={styles.cardRowText}>{payment.user_fullname}</Text>
              </View>
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Monto a pagar:</Text>
                <Text style={styles.cardRowText}>${getFinalAmount(payment)}</Text>
                {paymentStatus === PayStatusPending && (
                  <Icon
                    name="forward-to-inbox"
                    size={25}
                    color={isDarkMode ? iconDark : iconLight}
                    onPress={() => handleNotifyUser(payment.id)}
                    style={{ marginLeft: 5 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.value}>Sin Cuotas</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
