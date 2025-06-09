import React, { useContext } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GymProvider, GymContext } from "./context/GymContext";
import Navigation from "./navigation/Navigation";
import Toast from "react-native-toast-message";
import { getToastConfig } from "./components/Toast/Toast";
import { ConfirmModalProvider } from "./components/Alerts/ConfirmModalAlert";
import LoadingScreen from "./components/Loading/LoadingScreen";
import Login from "./screens/Login/Login";
import { mainBackgroundDark, mainBackgroundLight } from "./constants/UI/colors";

function AppContent() {
  const { user, isAuthLoading, isDarkMode } = useContext(GymContext);

  if (isAuthLoading) {
    return <LoadingScreen style={{ backgroundColor: isDarkMode ? mainBackgroundDark : mainBackgroundLight }} />;
  }

  if (user) {
    return <Navigation />;
  } else {
    return (
      <>
        <Login />
        <Toast config={getToastConfig(isDarkMode)} />
      </>
    );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GymProvider>
        <ConfirmModalProvider>
          <AppContent />
        </ConfirmModalProvider>
      </GymProvider>
    </SafeAreaProvider>
  );
}
