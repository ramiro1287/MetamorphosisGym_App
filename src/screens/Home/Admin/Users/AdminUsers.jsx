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
import { GymContext } from "../../../../context/GymContext";
import ScrollContainer from "../../../../components/Containers/ScrollContainer";
import { fetchWithAuth } from "../../../../services/authService";
import { toastError } from "../../../../components/Toast/Toast";
import TouchableButton from "../../../../components/Buttons/TouchableButton";
import {
  defaultTextDark, defaultTextLight,
  secondBackgroundDark, secondBackgroundLight,
  secondTextDark, secondTextLight,
  errorButtonTextDark,
} from "../../../../constants/UI/colors";
import debounce from "lodash.debounce";
import { StatusActive } from "../../../../constants/users";

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ id_number: "", first_name: "", last_name: "" });

  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isDarkMode } = useContext(GymContext);
  const navigation = useNavigation();

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
      toastError("Error", "Error de conexión");
    }
  }, [buildQuery]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
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

  const styles = StyleSheet.create({
    titleText: {
      fontSize: 22,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 10,
      alignSelf: "center",
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? secondTextDark : secondTextLight,
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
    },
    cardContainer: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderColor: isDarkMode ? defaultTextDark : defaultTextLight,
      borderRadius: 20,
      padding: 15,
      width: "100%",
      marginBottom: 20,
      borderRightWidth: 3,
      borderLeftWidth: 3,
    },
    cardRowContainer: { flexDirection: "row", marginBottom: 5 },
    cardRowTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDarkMode ? secondTextDark : secondTextLight,
      marginRight: 6,
    },
    cardRowText: { fontSize: 16, color: isDarkMode ? defaultTextDark : defaultTextLight },
    createButton: { alignSelf: "flex-end", marginBottom: 20, paddingVertical: 2, paddingHorizontal: 5 },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 25 }}>
      <Text style={styles.titleText}>Usuarios</Text>
      <TouchableButton title="Nuevo Usuario" onPress={handleCreateUser} style={styles.createButton} />

      <TextInput
        style={styles.input}
        placeholder="Buscar por DNI"
        placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
        value={filters.id_number}
        onChangeText={text => handleChange("id_number", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Buscar por nombre"
        placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
        value={filters.first_name}
        onChangeText={text => handleChange("first_name", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Buscar por apellido"
        placeholderTextColor={isDarkMode ? defaultTextDark : defaultTextLight}
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
                styles.cardContainer,
                user.status !== StatusActive && { borderColor: errorButtonTextDark },
              ]}
              onPress={() => handleUserDetail(user.id_number)}
            >
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>DNI:</Text>
                <Text style={styles.cardRowText}>{user.id_number}</Text>
              </View>
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Nombre:</Text>
                <Text style={styles.cardRowText}>{user.first_name}</Text>
              </View>
              <View style={styles.cardRowContainer}>
                <Text style={styles.cardRowTitle}>Apellido:</Text>
                <Text style={styles.cardRowText}>{user.last_name}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.titleText}>Sin usuarios...</Text>
        )}
      </ScrollContainer>
    </View>
  );
}
