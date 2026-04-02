import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Text, StyleSheet, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { GymContext } from "../../../context/GymContext";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import LoadingScreen from "../../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../../components/NoConnection/NoConnectionScreen";
import { fetchWithAuth } from "../../../services/authService";
import { toastError } from "../../../components/Toast/Toast";
import { PayStatusCanceled, PayStatusCompleted } from "../../../constants/payments";
import { buttonTextConfirmDark, inputErrorDark } from "../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../constants/UI/theme";
import { formatDate, formatPaymentStatus, formatPaymentMethod, getFinalAmount, getMonth } from "../../../utils/formatters";

export default function PaymentDetail() {
  const [payment, setPayment] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const route = useRoute();

  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  useFocusEffect(
    useCallback(() => {
      setConnectionError(false);
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
      if (error.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    loadPayment();
  };

  if (connectionError) return <NoConnectionScreen onRetry={handleRetry} />;
  if (!payment) return <LoadingScreen />;

  const styles = StyleSheet.create({
    cardRowContainer: {
      marginVertical: 5,
    },
    cardRowTitle: {
      fontSize: 18,
    },
    cardRowText: {
      fontSize: 20,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <View key={payment.id} style={common.cardContainer}>
        <View style={[common.cardRowContainer, styles.cardRowContainer]}>
          <Text style={[common.cardRowTitle, styles.cardRowTitle]}>Estado:</Text>
          <Text
            style={[
              common.cardRowText, styles.cardRowText,
              [PayStatusCompleted, PayStatusCanceled].includes(payment.status) ? { color: buttonTextConfirmDark } : { color: inputErrorDark }
            ]}
          >
            {formatPaymentStatus(payment.status)}
          </Text>
        </View>
        <View style={[common.cardRowContainer, styles.cardRowContainer]}>
          <Text style={[common.cardRowTitle, styles.cardRowTitle]}>Fecha de pago:</Text>
          <Text style={[common.cardRowText, styles.cardRowText]}>{payment.date_paid ? formatDate(payment.date_paid) : "N/A"}</Text>
        </View>
        <View style={[common.cardRowContainer, styles.cardRowContainer]}>
          <Text style={[common.cardRowTitle, styles.cardRowTitle]}>Forma de pago:</Text>
          <Text style={[common.cardRowText, styles.cardRowText]}>
            {payment.payment_method ? formatPaymentMethod(payment.payment_method) : "N/A"}
          </Text>
        </View>
        <View style={[common.cardRowContainer, styles.cardRowContainer]}>
          <Text style={[common.cardRowTitle, styles.cardRowTitle]}>Valor de la cuota:</Text>
          <Text style={[common.cardRowText, styles.cardRowText]}>${payment.total_amount}</Text>
        </View>
        <View style={[common.cardRowContainer, styles.cardRowContainer]}>
          <Text style={[common.cardRowTitle, styles.cardRowTitle]}>Monto a pagar:</Text>
          <Text style={[common.cardRowText, styles.cardRowText]}>${getFinalAmount(payment)}</Text>
        </View>
        <View style={[common.cardRowContainer, styles.cardRowContainer]}>
          <Text style={[common.cardRowTitle, styles.cardRowTitle]}>Mes correspondiente:</Text>
          <Text style={[common.cardRowText, styles.cardRowText]}>{getMonth(payment.created_at)}</Text>
        </View>

        {payment.penalties.length > 0 && (
          <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
            <Text style={[common.cardRowText, styles.cardRowText]}>Penalizaciónes aplicadas</Text>
          </View>
        )}
        {payment.penalties.length > 0 && payment.penalties.map((penalty, index) => (
          <View key={penalty.id} style={{flex: 1}}>
            <Text style={[common.cardRowTitle, styles.cardRowTitle]}>{index + 1}) {penalty.penalty.description}</Text>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text style={[common.cardRowText, styles.cardRowText, { flex: 0, marginRight: 5, color: inputErrorDark }]}>
                ${penalty.amount}
              </Text>
              <Icon name="arrow-upward" size={24} color={inputErrorDark} />
            </View>
          </View>
        ))}

        {payment.discounts.length > 0 && (
          <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
            <Text style={[common.cardRowText, styles.cardRowText]}>Descuentos aplicados</Text>
          </View>
        )}
        {payment.discounts.length > 0 && payment.discounts.map((discount, index) => (
          <View key={discount.id} style={{flex: 1}}>
            <Text style={[common.cardRowTitle, styles.cardRowTitle]}>{index + 1}) {discount.discount.description}</Text>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <Text style={[common.cardRowText, styles.cardRowText, { flex: 0, marginRight: 5, color: buttonTextConfirmDark }]}>
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
