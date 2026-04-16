import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import TouchableButton from "../../../../../components/Buttons/TouchableButton";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GymContext } from "../../../../../context/GymContext";
import ScrollContainer from "../../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../../services/authService";
import { toastError } from "../../../../../components/Toast/Toast";
import LoadingScreen from "../../../../../components/Loading/LoadingScreen";
import NoConnectionScreen from "../../../../../components/NoConnection/NoConnectionScreen";
import { getThemeColors, getCommonStyles } from "../../../../../constants/UI/theme";
import { formatDate } from "../../../../../utils/formatters";

const PAGE_SIZE = 10;

export default function AdminTrainingPlans() {
  const [templates, setTemplates] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

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
    }, [])
  );

  const handleLoadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try { await fetchPage({ url: nextUrl, append: true }); }
    finally { setLoadingMore(false); }
  };

  const handleTemplateDetail = (templateId) => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "AdminTrainingPlans" },
        { name: "AdminTrainingPlanDetail", params: { templateId } },
      ]
    });
  };

  const handleCreateTemplate = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "AdminTrainingPlans" },
        { name: "AdminTrainingPlanCreate" },
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
      ...common.titleText,
      fontSize: 20,
      marginTop: 20,
      marginBottom: 0,
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Plantillas de Entrenamiento</Text>
      <TouchableButton
        title="Crear nueva plantilla"
        onPress={handleCreateTemplate}
        style={{ alignSelf: "flex-end", marginVertical: 10 }}
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
              ]}
              onPress={() => handleTemplateDetail(template.id)}
            >
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Título:</Text>
                <Text style={common.cardRowText}>{template.title}</Text>
              </View>
              <View style={common.cardRowContainer}>
                <Text style={common.cardRowTitle}>Fecha de creación:</Text>
                <Text style={common.cardRowText}>{formatDate(template.created_at)}</Text>
              </View>
              {template.description ? (
                <View style={common.cardRowContainer}>
                  <Text style={common.cardRowTitle}>Descripción:</Text>
                  <Text style={common.cardRowText}>{template.description.length > 20 ? template.description.slice(0, 20) + "..." : template.description}</Text>
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
