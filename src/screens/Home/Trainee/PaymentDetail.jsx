import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { GymContext } from "../../../context/GymContext";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import LoadingScreen from "../../../components/Loading/LoadingScreen";
import { fetchWithAuth } from "../../../services/authService";
import { toastError } from "../../../components/Toast/Toast";
import {
  PayStatusCanceled, PayStatusCompleted,
  PayStatusPending, PayStatusProcessing,
  PayMethodMercadoPago, PayMethodBrubank,
  PayMethodBankTransfer, PayMethodCash,
  PayMethodDebit, MonthsMap,
} from "../../../constants/payments";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark, inputErrorDark,
  secondTextDark, secondTextLight,
} from "../../../constants/UI/colors";

export default function PaymentDetail() {
  const [payment, setPayment] = useState(null);
  const { isDarkMode } = useContext(GymContext);
  const route = useRoute();

  useFocusEffect(
    useCallback(() => {
      loadPayment();
    }, [])
  );

  const loadPayment = async () => {
    try {
      const { paymentId } = route.params || {};
      const response = await fetchWithAuth(`/payments/detail/${paymentId}/`);
      if (response.ok) {
        const { data } = await response.json();
        setPayment(data);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  if (!payment) return <LoadingScreen />;

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

  const formatDate = (isoString) => {
    if (!isoString) return "Sin fecha";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  };

  const formatPaymentMethod = (method) => {
    if (method === PayMethodMercadoPago) return "Mercado Pago";
    if (method === PayMethodBrubank) return "Brubank";
    if (method === PayMethodBankTransfer) return "Transferencia";
    if (method === PayMethodCash) return "Efectivo";
    if (method === PayMethodDebit) return "Debito";
    return "Sin forma de pago";
  };

  const styles = StyleSheet.create({
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
      marginVertical: 5
    },
    cardRowTitle: {
      fontSize: 18,
      color: isDarkMode ? secondTextDark : secondTextLight,
      marginRight: 6,
      flexShrink: 1,
    },
    cardRowText: {
      fontSize: 20,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginLeft: 6,
      flex: 1,
      flexShrink: 1,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <View key={payment.id} style={styles.cardContainer}>
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
          <Text style={styles.cardRowTitle}>Fecha de pago:</Text>
          <Text style={styles.cardRowText}>{payment.date_paid ? formatDate(payment.date_paid) : "N/A"}</Text>
        </View>
        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Forma de pago:</Text>
          <Text style={styles.cardRowText}>
            {payment.payment_method ? formatPaymentMethod(payment.payment_method) : "N/A"}
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

        {payment.penalties.length > 0 && (
          <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
            <Text style={styles.cardRowText}>Penalizaciónes aplicadas</Text>
          </View>
        )}
        {payment.penalties.length > 0 && payment.penalties.map((penalty, index) => (
          <View key={penalty.id} style={{flex: 1}}>
            <Text style={styles.cardRowTitle}>{index + 1}) {penalty.penalty.description}</Text>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text style={[styles.cardRowText, { flex: 0, marginRight: 5, color: inputErrorDark }]}>
                ${penalty.amount}
              </Text>
              <Icon name="arrow-upward" size={24} color={inputErrorDark} />
            </View>
          </View>
        ))}

        {payment.discounts.length > 0 && (
          <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
            <Text style={styles.cardRowText}>Descuentos aplicados</Text>
          </View>
        )}
        {payment.discounts.length > 0 && payment.discounts.map((discount, index) => (
          <View key={discount.id} style={{flex: 1}}>
            <Text style={styles.cardRowTitle}>{index + 1}) {discount.discount.description}</Text>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.cardRowText, { flex: 0, marginRight: 5, color: buttonTextConfirmDark }]}>
                ${discount.fixed_amount}
              </Text>
              <Icon name="arrow-downward" size={24} color={buttonTextConfirmDark} />
            </View>
          </View>
        ))}
      </View>
    </ScrollContainer>
  );
}
