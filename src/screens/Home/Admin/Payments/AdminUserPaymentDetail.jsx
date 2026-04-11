import React, { useContext, useState, useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import PickerSelect from "../../../../components/Picker/PickerSelect";
import DatePickerModal from "../../../../components/Picker/DatePickerModal";
import { useRoute, useNavigation } from "@react-navigation/native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import Icon from "react-native-vector-icons/MaterialIcons";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../../components/Alerts/ConfirmModalAlert";
import {
  PayStatusCanceled, PayStatusCompleted,
  PayStatusPending,
} from "../../../../constants/payments";
import {
  buttonTextConfirmDark, inputErrorDark,
} from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import { formatDate, formatPaymentStatus, formatPaymentMethod, getFinalAmount, getMonth } from "../../../../utils/formatters";

export default function AdminUserPaymentDetail() {
  const [payment, setPayment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [editValueError, setEditValueError] = useState("");
  const [penaltyDiscount, setPenaltyDiscount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const { isDarkMode, gymInfo } = useContext(GymContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { paymentId, fullName } = route.params || {};
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const hasChanges = Object.keys(editedFields).length > 0;
  const skipGuardRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      skipGuardRef.current = false;
      setConnectionError(false);
      loadPayment();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (skipGuardRef.current || !hasChanges) return;
      e.preventDefault();
      setPendingNavAction(e.data.action);
      setShowDiscardModal(true);
    });
    return unsubscribe;
  }, [navigation, hasChanges]);

  const loadPayment = async () => {
    try {
      const response = await fetchWithAuth(`/admin/payments/detail/${paymentId}/`);
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

  const handleFieldChange = (field, value) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
  };

  const toggleEditMode = () => {
    if (isEditing) {
      if (hasChanges) {
        setPendingNavAction(null);
        setShowDiscardModal(true);
      } else {
        setIsEditing(false);
        setEditedFields({});
      }
    } else {
      setIsEditing(true);
      if (!payment.payment_method && gymInfo.payment_methods?.length) {
        setEditedFields(prev => ({ ...prev, payment_method: gymInfo.payment_methods[0] }));
      }
    }
  };

  const doSaveFields = async (skipConfirm = false) => {
    const payload = { ...editedFields };

    if (payload.total_amount !== undefined) {
      const parsed = parseFloat(payload.total_amount);
      if (isNaN(parsed) || parsed < 0) {
        toastError("Error", "Ingrese un precio válido para el monto");
        return false;
      }
      payload.total_amount = parsed;
    }

    if (payload.date_paid instanceof Date) {
      payload.date_paid = payload.date_paid.toISOString().split("T")[0];
    }

    if (!skipConfirm) {
      const confirm = await showConfirmModalAlert("¿Guardar todos los cambios?");
      if (!confirm) return false;
    }

    try {
      const response = await fetchWithAuth(
        `/admin/payments/update/${paymentId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toastSuccess("Cuota actualizada correctamente");
        setIsEditing(false);
        setEditedFields({});
        loadPayment();
        return true;
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("Error", data.error_detail);
      } else {
        toastError("Error", "No se pudo actualizar la cuota");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
    return false;
  };

  const handleDiscard = () => {
    setShowDiscardModal(false);
    setIsEditing(false);
    setEditedFields({});
    if (pendingNavAction) {
      skipGuardRef.current = true;
      navigation.dispatch(pendingNavAction);
      setPendingNavAction(null);
    }
  };

  const handleSaveAndContinue = async () => {
    const action = pendingNavAction;
    setShowDiscardModal(false);
    setPendingNavAction(null);
    const success = await doSaveFields(true);
    if (success && action) {
      skipGuardRef.current = true;
      navigation.dispatch(action);
    }
  };

  const handleEditionModal = (field, obj) => {
    setEditField(field);
    setPenaltyDiscount(obj);
    if (field === "penalty_amount") setEditValue(String(obj.amount));
    else setEditValue(obj.fixed_amount || "0.00");
    setEditValueError("");
    setShowModal(true);
  };

  const formatFieldName = (field) => {
    if (field === "penalty_amount") return "monto de la penalización";
    if (field === "discount_amount") return "monto del descuento";
    return field;
  };

  const handleSaveField = async () => {
    const parsedPrice = parseFloat(editValue);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setEditValueError("Ingrese un precio válido");
      return;
    }

    if (editField === "penalty_amount") {
      handleUpdatePenalty({ amount: parsedPrice }, penaltyDiscount.id);
    } else if (editField === "discount_amount") {
      handleUpdateDiscount({ fixed_amount: parsedPrice }, penaltyDiscount.id);
    }
  };

  const onConfirmDatePaid = (selectedDate) => {
    setShowPicker(false);
    handleFieldChange("date_paid", selectedDate);
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
    cardRowContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginVertical: 5,
    },
    cardRowTitle: {
      fontSize: 18,
      color: t.secondText,
      marginRight: 6,
      flexShrink: 1,
    },
    cardRowText: {
      fontSize: 20,
      color: t.text,
      marginLeft: 6,
      flex: 1,
      flexShrink: 1,
    },
    penaltyCard: {
      flex: 1,
      padding: 10,
      borderRadius: 20,
      backgroundColor: t.background,
      marginTop: 10,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    editHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 15,
      marginBottom: 10,
    },
    editableText: {
      textDecorationLine: "underline",
    },
    editableInput: {
      borderBottomWidth: 1,
      borderColor: t.text,
      paddingVertical: 2,
    },
  });

  return (
    <ScrollContainer style={{ padding: 25 }}>
      <Text style={common.titleText}>Cuota de</Text>
      <Text style={common.titleText}>{fullName}</Text>
      <View key={payment.id} style={common.cardContainer}>
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={toggleEditMode}>
            <Icon name={isEditing ? "close" : "edit"} size={26} color={t.icon} />
          </TouchableOpacity>
          {isEditing && hasChanges && (
            <TouchableOpacity onPress={() => doSaveFields()}>
              <Icon name="save" size={26} color={buttonTextConfirmDark} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Estado:</Text>
          {isEditing ? (
            <View style={{ flex: 1 }}>
              <PickerSelect
                value={editedFields.status ?? payment.status}
                onValueChange={(value) => handleFieldChange("status", value)}
                items={[
                  { label: "Pendiente", value: PayStatusPending },
                  { label: "Cancelada", value: PayStatusCanceled },
                  { label: "Pagada", value: PayStatusCompleted },
                ]}
              />
            </View>
          ) : (
            <Text
              style={[
                styles.cardRowText,
                [PayStatusCompleted, PayStatusCanceled].includes(payment.status) ? { color: buttonTextConfirmDark } : { color: inputErrorDark }
              ]}
            >
              {formatPaymentStatus(payment.status)}
            </Text>
          )}
        </View>

        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Fecha de pago:</Text>
          {isEditing ? (
            <TouchableOpacity onPress={() => setShowPicker(true)} style={{ flex: 1 }}>
              <Text style={[styles.cardRowText, styles.editableText]}>
                {editedFields.date_paid
                  ? formatDate(editedFields.date_paid.toISOString().split("T")[0])
                  : (payment.date_paid ? formatDate(payment.date_paid) : "Seleccionar fecha")}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.cardRowText}>{payment.date_paid ? formatDate(payment.date_paid) : "N/A"}</Text>
          )}
        </View>

        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Forma de pago:</Text>
          {isEditing ? (
            <View style={{ flex: 1 }}>
              <PickerSelect
                value={editedFields.payment_method ?? payment.payment_method}
                onValueChange={(value) => handleFieldChange("payment_method", value)}
                items={gymInfo.payment_methods.map((method) => (
                  { label: formatPaymentMethod(method), value: method }
                ))}
              />
            </View>
          ) : (
            <Text style={styles.cardRowText}>
              {payment.payment_method ? formatPaymentMethod(payment.payment_method) : "N/A"}
            </Text>
          )}
        </View>

        <View style={styles.cardRowContainer}>
          <Text style={styles.cardRowTitle}>Valor de la cuota:</Text>
          {isEditing ? (
            <TextInput
              keyboardType="numeric"
              value={String(editedFields.total_amount ?? payment.total_amount)}
              onChangeText={(txt) => handleFieldChange("total_amount", txt)}
              style={[styles.cardRowText, styles.editableInput]}
              placeholder="Ingrese un precio"
              placeholderTextColor={t.secondText}
            />
          ) : (
            <Text style={styles.cardRowText}>${payment.total_amount}</Text>
          )}
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
                color={t.icon}
                onPress={() => handleEditionModal("penalty_amount", penalty)}
                style={{ marginLeft: 10 }}
              />
            </View>
            <TouchableButton
              title={penalty.enabled ? "Desactivar" : "Activar"}
              onPress={() => handleUpdatePenalty(null, penalty.id, penalty.enabled)}
              style={{ alignSelf: "flex-end" }}
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
                color={t.icon}
                onPress={() => handleEditionModal("discount_amount", discount)}
                style={{ marginLeft: 10 }}
              />
            </View>
            <TouchableButton
              title={discount.enabled ? "Desactivar" : "Activar"}
              onPress={() => handleUpdateDiscount(null, discount.id, discount.enabled)}
              style={{ alignSelf: "flex-end" }}
            />
          </View>
        ))}
      </View>

      <DatePickerModal
        visible={showPicker}
        value={editedFields.date_paid instanceof Date
          ? editedFields.date_paid
          : (payment.date_paid ? new Date(payment.date_paid) : new Date())}
        onConfirm={onConfirmDatePaid}
        onCancel={() => setShowPicker(false)}
        maximumDate={new Date()}
      />

      {showModal && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={common.modalContainer}>
            <View style={common.modalCardContainer}>
              <Text style={common.modalCardTitle}>
                Editar {formatFieldName(editField)}
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(editValue)}
                onChangeText={(txt) => {
                  setEditValue(txt);
                  setEditValueError("");
                }}
                style={common.modalCardTextInput}
                placeholder="Ingrese un precio"
                placeholderTextColor={t.text}
              />
              {editValueError ? <Text style={common.errorText}>{editValueError}</Text> : null}
              <View style={common.modalCardButtonsContainer}>
                <TouchableButton title="Cancelar" onPress={() => setShowModal(false)} />
                <TouchableButton title="Guardar" onPress={handleSaveField} style={{ marginLeft: 15 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showDiscardModal && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => { setPendingNavAction(null); setShowDiscardModal(false); }}
        >
          <View style={common.modalContainer}>
            <View style={common.modalCardContainer}>
              <Text style={common.modalCardTitle}>Cambios sin guardar</Text>
              <Text style={{ color: t.text, textAlign: "center", marginVertical: 10 }}>
                Tienes cambios sin guardar. ¿Qué deseas hacer?
              </Text>
              <View style={common.modalCardButtonsContainer}>
                <TouchableButton title="Descartar" variant="error" onPress={handleDiscard} />
                <TouchableButton title="Guardar" onPress={handleSaveAndContinue} style={{ marginLeft: 15 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollContainer>
  );
}
