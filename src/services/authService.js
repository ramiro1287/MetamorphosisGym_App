import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_SERVER_URL, EXPIRES_IN } from "@env";

let refreshTimer = null;

export const saveToken = async (access_token, refresh_token) => {
  await AsyncStorage.setItem("access_token", access_token);
  await AsyncStorage.setItem("refresh_token", refresh_token);
  scheduleTokenRefresh(parseInt(EXPIRES_IN, 10));
};


export const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await fetch(`${BASE_SERVER_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) throw new Error("Failed to refresh token");

    const { access, refresh } = await response.json();
    await saveToken(access, refresh);
    return access;
  } catch (error) {
    return null;
  }
};


const scheduleTokenRefresh = (expires_in) => {
  if (refreshTimer) clearTimeout(refreshTimer);
  const refreshTime = (expires_in - 30) * 1000; 
  refreshTimer = setTimeout(refreshAccessToken, refreshTime);
};


export const fetchWithAuth = async (url, options = {}) => {
  let token = await AsyncStorage.getItem("access_token");

  const isFullUrl = url.startsWith("http://") || url.startsWith("https://");
  const full_url = isFullUrl ? url : `${BASE_SERVER_URL}${url}`;

  let response = await fetch(full_url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      response = await fetch(full_url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return response;
};


export const logout = async () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  await AsyncStorage.removeItem("access_token");
  await AsyncStorage.removeItem("refresh_token");
};
