import React, { useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError } from "../../../../components/Toast/Toast";
import NoConnectionScreen from "../../../../components/NoConnection/NoConnectionScreen";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import { errorButtonTextDark } from "../../../../constants/UI/colors";
import { getThemeColors, getCommonStyles } from "../../../../constants/UI/theme";
import debounce from "lodash.debounce";
import { StatusActive, TraineeRole } from "../../../../constants/users";

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ id_number: "", first_name: "", last_name: "" });

  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();
  const t = getThemeColors(isDarkMode);
  const common = getCommonStyles(isDarkMode);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    q.append("page_size", String(PAGE_SIZE));
    if (filters.id_number) q.append("id_number", filters.id_number);
    if (filters.first_name) q.append("first_name", filters.first_name);
    if (filters.last_name) q.append("last_name", filters.last_name);
    return q.toString();
  }, [filters.id_number, filters.first_name, filters.last_name]);

  const fetchPage = useCallback(async ({ url, append = false } = {}) => {
    try {
      const finalUrl = url ?? `/admin/users/list/?${buildQuery()}`;
      const response = await fetchWithAuth(finalUrl);
      if (!response.ok) throw new Error("Network");

      const { data } = await response.json();
      setNextUrl(data.next ?? null);
      setUsers(prev => (append ? [...prev, ...data.results] : data.results));
    } catch (e) {
      if (e.message === 'Network request failed') {
        setConnectionError(true);
      } else {
        toastError("Error", "Error de conexión");
      }
    }
  }, [buildQuery]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setConnectionError(false);
        setLoading(true);
        try { if (alive) await fetchPage({ append: false }); }
        finally { if (alive) setLoading(false); }
      })();
      return () => { alive = false; };
    }, [fetchPage])
  );

  useEffect(() => {
    setNextUrl(null);
    const debounced = debounce(async () => {
      setLoading(true);
      try { await fetchPage({ append: false }); }
      finally { setLoading(false); }
    }, 500);

    debounced();
    return () => debounced.cancel();
  }, [filters, fetchPage]);

  const loadMore = async () => {
    if (loadingMore || !nextUrl) return;
    setLoadingMore(true);
    try {
      await fetchPage({ url: nextUrl, append: true });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUserDetail = (idNumber) => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserDetail", params: { idNumber } }
      ]
    });
  };

  const handleCreateUser = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminCreateUser" }
      ]
    });
  };

  const handleUserPayments = (idNumber, firstName, lastName) => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "AdminUsers" },
        { name: "AdminUserPayments", params: { idNumber, fullName: `${firstName} ${lastName}` } },
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
    cardRowContainer: { flexDirection: "row", marginBottom: 5 },
    cardRowTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: t.secondText,
      marginRight: 6,
    },
    cardRowText: { fontSize: 16, color: t.text },
    cardContent: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    cardInfo: {
      flex: 1,
      marginRight: 10,
    },
    paymentButton: {
      backgroundColor: t.buttonBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    paymentButtonText: {
      color: t.buttonText,
      fontSize: 12,
      fontWeight: "600",
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={common.titleText}>Usuarios</Text>
      <TouchableButton title="Nuevo Usuario" onPress={handleCreateUser} style={{ alignSelf: "flex-end", marginBottom: 10 }} />

      <TextInput
        style={common.searchInput}
        placeholder="Buscar por DNI"
        placeholderTextColor={t.text}
        value={filters.id_number}
        onChangeText={text => handleChange("id_number", text)}
      />
      <TextInput
        style={common.searchInput}
        placeholder="Buscar por nombre"
        placeholderTextColor={t.text}
        value={filters.first_name}
        onChangeText={text => handleChange("first_name", text)}
      />
      <TextInput
        style={common.searchInput}
        placeholder="Buscar por apellido"
        placeholderTextColor={t.text}
        value={filters.last_name}
        onChangeText={text => handleChange("last_name", text)}
      />

      <ScrollContainer
        style={{ marginTop: 20 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        loadingMore={loadingMore}
        ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
      >
        {loading && !users.length ? (
          <ActivityIndicator />
        ) : users.length ? (
          users.map((user) => (
            <TouchableOpacity
              key={user.id_number}
              style={[
                common.cardContainerBordered,
                user.status !== StatusActive && { borderColor: errorButtonTextDark },
              ]}
              onPress={() => handleUserDetail(user.id_number)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardRowContainer}>
                    <Text style={styles.cardRowTitle}>DNI:</Text>
                    <Text style={styles.cardRowText}>{user.id_number}</Text>
                  </View>
                  <View style={styles.cardRowContainer}>
                    <Text style={styles.cardRowTitle}>Nombre:</Text>
                    <Text style={styles.cardRowText} numberOfLines={1} ellipsizeMode="tail">{user.first_name}</Text>
                  </View>
                  <View style={styles.cardRowContainer}>
                    <Text style={styles.cardRowTitle}>Apellido:</Text>
                    <Text style={styles.cardRowText} numberOfLines={1} ellipsizeMode="tail">{user.last_name}</Text>
                  </View>
                </View>
                {user.role === TraineeRole && (
                  <TouchableOpacity
                    style={styles.paymentButton}
                    onPress={() => handleUserPayments(user.id_number, user.first_name, user.last_name)}
                  >
                    <Icon name="credit-card" size={24} color={t.buttonText} />
                    <Text style={styles.paymentButtonText}>Cuotas</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={common.titleText}>Sin usuarios...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
