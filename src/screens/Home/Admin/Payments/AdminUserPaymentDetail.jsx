import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  PayStatusCanceled, PayStatusCompleted,
  PayStatusPending, PayStatusProcessing,
  PayMethodMercadoPago, PayMethodBrubank,
  PayMethodBankTransfer, PayMethodCash,
  PayMethodDebit, MonthsMap,
} from "../../../../constants/payments";
import {
  iconDark, iconLight, inputErrorLight,
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  buttonTextConfirmDark, inputErrorDark,
  secondTextDark, secondTextLight,
  mainBackgroundDark, mainBackgroundLight,
} from "../../../../constants/UI/colors";

export default function AdminUserPaymentDetail() {
  const [payment, setPayment] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [editValueError, setEditValueError] = useState("");
  const [penaltyDiscount, setPenaltyDiscount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const route = useRoute();
  const { paymentId, fullName } = route.params || {};

  useFocusEffect(
    useCallback(() => {
      loadPayment();
    }, [])
  );

  const loadPayment = async () => {
    try {
      const response = await fetchWithAuth(`/admin/payments/detail/${paymentId}/`);
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
    if (status === PayStatusPending) return "Pendiente";
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

  const handleEditionModal = (field, obj) => {
    setEditField(field);
    if (obj) {
      setPenaltyDiscount(obj);
      if (field === "penalty_amount") setEditValue(obj.amount);
      else setEditValue(obj.fixed_amount || "0.00");
    } else setEditValue(payment[field] || "");
    setEditValueError("");
    setShowModal(true);
  };

  const formatFieldName = (field) => {
    if (field === "status") return "estado de la cuota";
    if (field === "payment_method") return "forma de pago";
    if (field === "total_amount") return "monto de la cuota";
    if (field === "penalty_amount") return "monto de la penalización";
    if (field === "discount_amount") return "monto del descuento";
    return field;
  };

  const handleSaveField = async () => {
    let parsedPrice = 0

    if (["total_amount", "penalty_amount", "discount_amount"].includes(editField)) {
      parsedPrice = parseFloat(editValue);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        setEditValueError("Ingrese un precio válido");
        return;
      }
    }

    if (editField === "penalty_amount") {
      handleUpdatePenalty({ amount: parsedPrice }, penaltyDiscount.id)
      return;
    }
    if (editField === "discount_amount") {
      handleUpdateDiscount({ fixed_amount: parsedPrice }, penaltyDiscount.id)
      return;
    }

    const confirm = await showConfirmModalAlert(
        "¿Estás seguro de actualizar el campo?"
    );
    if (!confirm) {
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
        return;
    }

    try {
      const response = await fetchWithAuth(
        `/admin/payments/update/${paymentId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [editField]: editField === "total_amount" ? parsedPrice : editValue
          }),
        }
      );
  
      if (response.ok) {
        toastSuccess("Campo actualizado correctamente");
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
        loadPayment();
        return;
      } if (response.status === 400) {
        setShowModal(false);
        const { data } = await response.json();
        toastError(data.error_detail);
        setEditField(null);
        setEditValue(null);
        return;
      } else {
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
        toastError("Error", "No se pudo actualizar el campo");
        return;
      }
    } catch (error) {
      setShowModal(false);
      setEditField(null);
      setEditValue(null);
      toastError("Error", "Error de conexión");
    }
  };

  const onChangeDatePaid = async (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de cambiar la fecha de pago?"
    );
    if (!confirm) {
      if (Platform.OS === "android") setShowPicker(false);
      return;
    }

    handleUpdateDatePaid(selectedDate);
    if (Platform.OS === "android") setShowPicker(false);
  };

  const handleUpdateDatePaid = async (date) => {
    try {
      const response = await fetchWithAuth(
        `/admin/payments/update/${paymentId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date_paid: date.toISOString().split("T")[0] }),
        }
      );

      if (response.ok) {
        toastSuccess("Fecha de pago actualizada");
        loadPayment();
      } else {
        toastError("Error", "No se pudo actualizar la fecha de pago");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  const handleUpdatePenalty = async (payload, penaltyId, enabledValue) => {
    let msg = ""
    if (payload) msg = "¿Estás seguro de actualizar el precio?";
    else msg = enabledValue ? "¿Estás seguro de desactivar la penalización?" : "¿Estás seguro de activar la penalización?";
    const confirm = await showConfirmModalAlert(msg);
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/payments/penalty/${penaltyId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload ? payload : { enabled: enabledValue ? 0 : 1 }),
        }
      );

      if (response.ok) {
        if (payload) {
          toastSuccess("Precio actualizado");
        } else {
          if (enabledValue) toastSuccess("Penalización desactivada");
          else toastSuccess("Penalización activada");
        }
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
        loadPayment();
      } else {
        if (payload) {
          toastError("Error", "No se pudo actualizar el precio");
        } else {
          if (enabledValue) toastError("Error", "No se pudo desactivar la penalización");
          else toastError("Error", "No se pudo activar la penalización");
        }
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
      }
    } catch (error) {
      setShowModal(false);
      setEditField(null);
      setEditValue(null);
      toastError("Error", "Error de conexión");
    }
  };

  const handleUpdateDiscount = async (payload, discountId, enabledValue) => {
    let msg = ""
    if (payload) msg = "¿Estás seguro de actualizar el precio?";
    else msg = enabledValue ? "¿Estás seguro de desactivar el descuento?" : "¿Estás seguro de activar el descuento?";
    const confirm = await showConfirmModalAlert(msg);
    if (!confirm) return;

    try {
      const response = await fetchWithAuth(
        `/admin/payments/discount/${discountId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload ? payload : { enabled: enabledValue ? 0 : 1 }),
        }
      );

      if (response.ok) {
        if (payload) {
          toastSuccess("Precio actualizado");
        } else {
          if (enabledValue) toastSuccess("Descuento desactivado");
          else toastSuccess("Descuento activado");
        }
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
        loadPayment();
      } else {
        if (payload) {
          toastError("Error", "No se pudo actualizar el precio");
        } else {
          if (enabledValue) toastError("Error", "No se pudo desactivar el descuento");
          else toastError("Error", "No se pudo activar el descuento");
        }
        setShowModal(false);
        setEditField(null);
        setEditValue(null);
      }
    } catch (error) {
      setShowModal(false);
      setEditField(null);
      setEditValue(null);
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
    penaltyCard: {
      flex: 1,
      padding: 10,
      borderRadius: 20,
      backgroundColor: isDarkMode ? mainBackgroundDark : mainBackgroundLight,
      marginTop: 10,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      borderWidth: 1.5,
      padding: 20,
      borderRadius: 12,
      width: "80%",
    },
    modalCardTitle: {
      fontSize: 18,
      marginBottom: 10,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      alignSelf: "center",
    },
    pickerSelect: {
      inputIOS: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
      inputAndroid: {
        fontSize: 18,
        color: isDarkMode ? defaultTextDark : defaultTextLight,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      },
    },
    modalCardButtonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
    },
    modalCardTextInput: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
    penaltybutton: {
      alignSelf: "flex-end",
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <Text style={styles.titleText}>Cuota de</Text>
      <Text style={styles.titleText}>{fullName}</Text>
      <View key={payment.id} style={styles.cardContainer}>
        <View style={styles.cardRowContainer}>
          <Icon
            name="edit"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => handleEditionModal("status")}
            style={{ marginRight: 10 }}
          />
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
          <Icon
            name="edit"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => setShowPicker(true)}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.cardRowTitle}>Fecha de pago:</Text>
          <Text style={styles.cardRowText}>{payment.date_paid ? formatDate(payment.date_paid) : "N/A"}</Text>
        </View>
        <View style={styles.cardRowContainer}>
          <Icon
            name="edit"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => handleEditionModal("payment_method")}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.cardRowTitle}>Forma de pago:</Text>
          <Text style={styles.cardRowText}>
            {payment.payment_method ? formatPaymentMethod(payment.payment_method) : "N/A"}
          </Text>
        </View>
        <View style={styles.cardRowContainer}>
          <Icon
            name="edit"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => handleEditionModal("total_amount")}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.cardRowTitle}>Valor de la cuota:</Text>
          <Text style={styles.cardRowText}>${payment.total_amount}</Text>
        </View>
        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Monto a pagar:</Text>
          <Text style={styles.cardRowText}>${getFinalAmount(payment)}</Text>
        </View>
        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Mes de:</Text>
          <Text style={styles.cardRowText}>
            {getMonth(payment.created_at)} {new Date(payment.created_at).getFullYear()}
          </Text>
        </View>

        {payment.penalties.length > 0 && (
          <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
            <Text style={styles.cardRowText}>Penalizaciones aplicadas</Text>
          </View>
        )}
        {payment.penalties.length > 0 && payment.penalties.map((penalty, index) => (
          <View
            key={penalty.id}
            style={[
              styles.penaltyCard,
              penalty.enabled ? { borderColor: buttonTextConfirmDark } : { borderColor: inputErrorDark },
            ]}
          >
            <Text style={styles.cardRowTitle}>{index + 1}) {penalty.penalty.description}</Text>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text style={[styles.cardRowText, { flex: 0, marginRight: 5, color: inputErrorDark }]}>
                ${penalty.amount}
              </Text>
              <Icon name="arrow-upward" size={24} color={inputErrorDark} />
              <Icon
                name="edit"
                size={25}
                color={isDarkMode ? iconDark : iconLight}
                onPress={() => handleEditionModal("penalty_amount", penalty)}
                style={{ marginLeft: 10 }}
              />
            </View>
            <TouchableButton
              title={penalty.enabled ? "Desactivar" : "Activar"}
              onPress={() => handleUpdatePenalty(null, penalty.id, penalty.enabled)}
              style={styles.penaltybutton}
              textButtonStyle={{
                fontSize: 16,
                color: penalty.enabled ? inputErrorDark : buttonTextConfirmDark
              }}
            />
          </View>
        ))}

        {payment.discounts.length > 0 && (
          <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
            <Text style={styles.cardRowText}>Descuentos aplicados</Text>
          </View>
        )}
        {payment.discounts.length > 0 && payment.discounts.map((discount, index) => (
          <View
            key={discount.id}
            style={[
              styles.penaltyCard,
              discount.enabled ? { borderColor: buttonTextConfirmDark } : { borderColor: inputErrorDark },
            ]}
          >
            <Text style={styles.cardRowTitle}>{index + 1}) {discount.discount.description}</Text>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.cardRowText, { flex: 0, marginRight: 5, color: buttonTextConfirmDark }]}>
                ${discount.fixed_amount}
              </Text>
              <Icon name="arrow-downward" size={24} color={buttonTextConfirmDark} />
              <Icon
                name="edit"
                size={25}
                color={isDarkMode ? iconDark : iconLight}
                onPress={() => handleEditionModal("discount_amount", discount)}
                style={{ marginLeft: 10 }}
              />
            </View>
            <TouchableButton
              title={discount.enabled ? "Desactivar" : "Activar"}
              onPress={() => handleUpdateDiscount(null, discount.id, discount.enabled)}
              style={styles.penaltybutton}
              textButtonStyle={{
                fontSize: 16,
                color: discount.enabled ? inputErrorDark : buttonTextConfirmDark
              }}
            />
          </View>
        ))}
      </View>

      {showPicker && (
        <DateTimePicker
          value={payment.date_paid ? new Date(payment.date_paid) : new Date()}
          mode="date"
          display="spinner"
          onChange={onChangeDatePaid}
          maximumDate={new Date()}
        />
      )}

      {showModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCardContainer}>
              <Text style={styles.modalCardTitle}>
                Editar {formatFieldName(editField)}
              </Text>

              {editField === "status" ? (
                <RNPickerSelect
                  value={editValue}
                  onValueChange={(value) => setEditValue(value)}
                  items={[
                    { label: "Pendiente", value: PayStatusPending, color: defaultTextLight },
                    { label: "Cancelada", value: PayStatusCanceled, color: defaultTextLight },
                    { label: "Pagada", value: PayStatusCompleted, color: defaultTextLight },
                  ]}
                  style={styles.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
              ) : editField === "payment_method" ? (
                <RNPickerSelect
                  value={editValue}
                  onValueChange={(value) => setEditValue(value)}
                  items={gymInfo.payment_methods.map((method) => (
                    {label: formatPaymentMethod(method), value: method, color: defaultTextLight }
                  ))}
                  style={styles.pickerSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{}}
                />
              ) : editField === "total_amount" ? (
                <>
                  <TextInput
                    keyboardType="numeric"
                    value={editValue}
                    onChangeText={(txt) => {
                      setEditValue(txt);
                      setEditValueError("");
                    }}
                    style={styles.modalCardTextInput}
                    placeholder="Ingrese un precio"
                    placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                  {editValueError ? <Text style={styles.errorText}>{editValueError}</Text> : null}
                </>
              ) : editField === "penalty_amount" ? (
                <>
                  <TextInput
                    keyboardType="numeric"
                    value={editValue}
                    onChangeText={(txt) => {
                      setEditValue(txt);
                      setEditValueError("");
                    }}
                    style={styles.modalCardTextInput}
                    placeholder="Ingrese un precio"
                    placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                  {editValueError ? <Text style={styles.errorText}>{editValueError}</Text> : null}
                </>
              ) : editField === "discount_amount" ? (
                <>
                  <TextInput
                    keyboardType="numeric"
                    value={editValue}
                    onChangeText={(txt) => {
                      setEditValue(txt);
                      setEditValueError("");
                    }}
                    style={styles.modalCardTextInput}
                    placeholder="Ingrese un precio"
                    placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  />
                  {editValueError ? <Text style={styles.errorText}>{editValueError}</Text> : null}
                </>
              ) : null
              }

              <View style={styles.modalCardButtonsContainer}>
                <TouchableButton title="Cancelar" onPress={() => setShowModal(false)} />
                <TouchableButton title="Guardar" onPress={handleSaveField} style={{ marginLeft: 15 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollContainer>
  );
}
