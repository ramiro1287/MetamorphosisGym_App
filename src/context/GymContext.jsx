import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshAccessToken, logout, fetchWithAuth } from "../services/authService";

export const GymContext = createContext();

export const GymProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [gymInfo, setGymInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("darkMode");
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === "true");
        }
      } catch (e) {
        console.error("Error cargando el tema", e);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("darkMode", isDarkMode.toString());
      } catch (e) {
        console.error("Error guardando el tema", e);
      }
    };
    saveTheme();
  }, [isDarkMode]);

  const refreshUser = async () => {
    try {
      const response = await fetchWithAuth("/users/me/");
      if (response.ok) {
        const { data } = await response.json();
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Error actualizando el usuario", err);
    }
  };

  const getGymInfo = async () => {
    try {
      const response = await fetchWithAuth("/users/gym/info/");
      const { data } = await response.json();
      setGymInfo(data);
    } catch (err) {
      console.error("Error obteniendo la info del gimnasio:", err);
    }
  };

  const checkAuth = async () => {
    setIsAuthLoading(true);
    const token = await refreshAccessToken();

    if (token) {
      await refreshUser();
    } else {
      handleLogout();
    }
    setIsAuthLoading(false);
  };

  const getHasUnreadNotifications = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/notifications/unread/");
      if (response.ok) {
        const { data } = await response.json();
        setHasUnreadNotifications(data.has_unread);
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  }, []);

  useEffect(() => {
    let intervalId;

    if (user) {
      getHasUnreadNotifications();
      intervalId = setInterval(getHasUnreadNotifications, 60000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, getHasUnreadNotifications]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchGymInfo = async () => {
      if (!user) return;
      await getGymInfo();
    };
    fetchGymInfo();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <GymContext.Provider
      value={{
        user, setUser,
        handleLogout, refreshUser,
        gymInfo, getGymInfo,
        isDarkMode, setIsDarkMode,
        isAuthLoading,
        hasUnreadNotifications,
        getHasUnreadNotifications,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};
