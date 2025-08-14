import React, { useContext, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import ScrollContainer from "../../../components/Containers/ScrollContainer";
import { GymContext } from "../../../context/GymContext";
import TouchableButton from "../../../components/Buttons/TouchableButton";
import { fetchWithAuth } from "../../../services/authService";
import { toastError, toastSuccess } from "../../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../../components/Alerts/ConfirmModalAlert";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  inputErrorDark, inputErrorLight,
} from "../../../constants/UI/colors";

export default function AdminAnnouncementCreate() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    expiration_date: null,
  });

  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [expirationDateError, setExpirationDateError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { isDarkMode, getHasUnreadNotifications } = useContext(GymContext);

  const handleChange = (key, value) => {
    if (key === "title") setTitleError("");
    if (key === "description") setDescriptionError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    let hasError = false;

    if (!form.title.trim()) {
      setTitleError("Ingresar un título");
      hasError = true;
    }

    if (!form.description.trim()) {
      setDescriptionError("Ingresar una descripción");
      hasError = true;
    }

    if (!form.expiration_date) {
      setExpirationDateError("Ingresar una fecha de expiracion");
      hasError = true;
    }

    if (hasError) return;

    const confirm = await showConfirmModalAlert(
      "¿Estás seguro de crear el anuncio?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
      };
      if (form.expiration_date) {
        payload.expiration_date = formatDateForAPI(form.expiration_date);
      }

      const response = await fetchWithAuth(
        "/admin/notifications/annoucements/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        getHasUnreadNotifications();
        toastSuccess("Anuncio creado");
        navigation.goBack();
      } else if (response.status === 400) {
        const { data } = await response.json();
        toastError("", data.error_detail);
        setForm({ title: "", description: "", expiration_date: null });
      } else {
        toastError("Error", `Código ${response.status}`);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForText = (date) => {
    if (!date) return "—";
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utc.toISOString().slice(0, 10);
  }

  const onChange = (_event, selectedDate) => {
    setExpirationDateError("");
    if (Platform.OS === "android") setShowPicker(false);
    if (!selectedDate) return;
    setForm((prev) => ({ ...prev, expiration_date: selectedDate }));
  };

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 15,
      alignSelf: "center",
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 20,
      paddingTop: 0,
      width: "80%",
    },
    cardInputContainer: {
      flex: 1,
      marginTop: 15,
    },
    cardInputLabel: {
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
    },
    cardInput: {
      flex: 1,
      fontSize: 18,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      borderBottomWidth: 1,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      paddingVertical: 5
    },
    expirationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    errorText: {
      color: isDarkMode ? inputErrorDark : inputErrorLight,
      marginBottom: 8,
      fontSize: 16,
    },
  });

  return (
    <ScrollContainer>
      <Text style={styles.titleText}>Nuevo Anuncio</Text>
      <View style={styles.cardContainer}>
        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Título:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.title}
            onChangeText={(t) => handleChange("title", t)}
          />
        </View>
        {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

        <View style={styles.cardInputContainer}>
          <Text style={styles.cardInputLabel}>Descripción:</Text>
          <TextInput
            style={styles.cardInput}
            value={form.description}
            onChangeText={(t) => handleChange("description", t)}
            multiline
          />
        </View>
        {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}

        <View style={[styles.cardInputContainer, styles.expirationRow]}>
          <Text style={styles.cardInputLabel}>
            Expiración: {formatDateForText(form.expiration_date)}
          </Text>
          <Icon
            name="edit"
            size={25}
            color={isDarkMode ? iconDark : iconLight}
            onPress={() => setShowPicker(true)}
            style={{ marginLeft: 5 }}
          />
        </View>
        {expirationDateError ? <Text style={styles.errorText}>{expirationDateError}</Text> : null}

        <TouchableButton
          title="Crear anuncio"
          onPress={handleSubmit}
          loading={loading}
          style={{ alignSelf: "center", marginTop: 10 }}
        />
      </View>

      {showPicker && (
        <DateTimePicker
          value={form.expiration_date ?? new Date()}
          mode="date"
          display="spinner"
          onChange={onChange}
          minimumDate={new Date()}
        />
      )}
    </ScrollContainer>
  );
}
