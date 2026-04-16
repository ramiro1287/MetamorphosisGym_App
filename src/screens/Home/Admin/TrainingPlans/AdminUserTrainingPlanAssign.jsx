import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError, toastSuccess } from "../../../../components/Toast/Toast";
import LoadingScreen from "../../../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import { buttonTextConfirmDark } from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import TouchableButton from "../../../../components/Buttons/TouchableButton";

const PAGE_SIZE = 10;

export default function AdminUserTrainingPlanAssign() {
  const [templates, setTemplates] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [expirationDate, setExpirationDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      const base = `/admin/training-plans/templates/`;
      const finalUrl = url ?? `${base}?${buildQuery()}`;

      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json();
      setNextUrl(data.next ?? null);
      setTemplates(prev => (append ? [...prev, ...data.results] : data.results));
    } catch (err) {
      if (err.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error al cargar plantillas");
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
    }, [])
  );

  const handleLoadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try { await fetchPage({ url: nextUrl, append: true }); }
    finally { setLoadingMore(false); }
  };

  const handleAssign = async () => {
    if (!selectedTemplateId) {
      toastError("Error", "Selecciona una plantilla primero");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetchWithAuth(`/admin/training-plans/templates/assign/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          trainee_id_number: idNumber,
          expiration_date: expirationDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_detail || "Error al asignar");
      }

      toastSuccess("Éxito", "Plan asignado correctamente");
      navigation.goBack();
    } catch (err) {
      toastError("Error", err.message || "Error al asignar plan");
    } finally {
      setSubmitting(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setExpirationDate(selectedDate);
  };

  if (connectionError) {
    return <NoConnectionScreen onRetry={() => {
      setConnectionError(false);
      setLoading(true);
      fetchPage().finally(() => setLoading(false));
    }} />;
  }

  const styles = StyleSheet.create({
    titleText: {
      ...common.titleText,
      fontSize: 20,
      marginTop: 10,
      marginBottom: 0,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 15,
      marginBottom: 10,
    },
    dateButton: {
      padding: 10,
      backgroundColor: t.navbarBackground,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: t.textMain,
    },
    dateText: {
      color: t.textMain,
    }
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Asignar plan de entrenamiento</Text>
      <Text style={styles.titleText}>{fullName}</Text>

      <View style={styles.dateContainer}>
        <Text style={common.cardRowTitle}>Fecha de expiración:</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{expirationDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={expirationDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date(Date.now() + 3 * 60 * 60 * 1000)}
        />
      )}

      <TouchableButton
        title={submitting ? "Asignando..." : "Asignar seleccionada"}
        onPress={handleAssign}
        style={{ marginVertical: 10 }}
        disabled={submitting || !selectedTemplateId}
      />

      <ScrollContainer
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        loadingMore={loadingMore}
        ListFooterComponent={loadingMore ? <LoadingScreen /> : null}
      >
        {loading && !templates.length ? (
          <ActivityIndicator />
        ) : templates.length ? (
          templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                common.cardContainerBordered,
                selectedTemplateId === template.id && { borderColor: buttonTextConfirmDark, borderWidth: 2 }
              ]}
              onPress={() => setSelectedTemplateId(template.id)}
            >
              <View style={common.cardRowContainer}>
                <Text style={[common.cardRowText, { fontSize: 20 }]}>{template.title}</Text>
              </View>
              {template.description ? (
                <View style={common.cardRowContainer}>
                  <Text style={common.cardRowTitle}>{template.description}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.titleText}>Sin plantillas...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
