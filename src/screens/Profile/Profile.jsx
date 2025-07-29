import React, { useContext, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  Modal, 
  Pressable,
  Dimensions 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import TouchableButton from "../../components/Buttons/TouchableButton";
import { GymContext } from "../../context/GymContext";
import { fetchWithAuth } from "../../services/authService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { toastError, toastSuccess } from "../../components/Toast/Toast";
import { showConfirmModalAlert } from "../../components/Alerts/ConfirmModalAlert";
import ScrollContainer from "../../components/Containers/ScrollContainer";
import { AdminRole, CoachRole, StatusDeleted } from "../../constants/users";
import {
  iconDark, iconLight,
  defaultTextDark, defaultTextLight,
  secondTextDark, secondTextLight,
  secondBackgroundDark, secondBackgroundLight,
} from "../../constants/UI/colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


const DatePickerModal = React.memo(({ showPicker, closeDatePicker, styles, screenWidth, handleConfirm, isDarkMode, onDateChange, tempDate, user }) => {
    const isAndroid = Platform.OS === 'android';
    
    return (
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDatePicker}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlay} 
            onPress={closeDatePicker}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <Text style={styles.modalTitle}>
                Seleccionar fecha de nacimiento
              </Text>
              
              {/* Wrap DateTimePicker in a container to prevent auto-close on Android */}
              <View style={{ 
                width: screenWidth * 0.8,
                maxWidth: 320,
                alignItems: 'center',
              }}>
                <DateTimePicker
                  value={tempDate || (user.birth_date ? new Date(user.birth_date) : new Date())}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor={isDarkMode ? defaultTextDark : defaultTextLight}
                  style={{
                    width: '100%',
                    height: isAndroid ? 200 : 'auto',
                  }}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeDatePicker}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    );
});

export default function Profile() {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const {
    user,
    refreshUser,
    isDarkMode,
    setIsDarkMode,
    handleLogout,
  } = useContext(GymContext);
  const navigation = useNavigation();

  const handleChangePassword = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "Profile" },
        { name: "ChangePassword" }
      ]
    });
  };

  const openDatePicker = () => {
    setTempDate(user.birth_date ? new Date(user.birth_date) : new Date());
    setShowPicker(true);
  };

  const closeDatePicker = () => {
    setShowPicker(false);
    setTempDate(null);
  };

  const onDateChange = (event, selectedDate) => {
    // Only update temp date, don't do anything else
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirm = async () => {
    if (tempDate) {
      setShowPicker(false);
      // Use setTimeout to ensure modal closes before showing alert
      setTimeout(async () => {
        try {
          const confirm = await showConfirmModalAlert(
            "¿Estás seguro de cambiar tu fecha de nacimiento?"
          );
          if (confirm) {
            await handleChangeBirthDate(tempDate);
          }
        } catch (error) {
          console.log('Error in handleConfirm:', error);
        } finally {
          setTempDate(null);
        }
      }, 200);
    }
  };

  const handleChangeBirthDate = async (date) => {
    try {
      const response = await fetchWithAuth("/users/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth_date: date.toISOString().split("T")[0] }),
      });

      if (response.ok) {
        toastSuccess("Fecha de nacimiento actualizada");
        refreshUser();
      } else {
        toastError("Error", "No se pudo cambiar tu fecha de nacimiento");
      }
    } catch (error) {
      toastError("Error", "Error de conexión");
    }
  };

  if (!user) return null;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  };

  const formatRole = (role) => {
    if (role === AdminRole) return "Administrador";
    if (role === CoachRole) return "Entrenador";
    return "Cliente";
  };

  const formatStatus = (status) => {
    if (status === StatusDeleted) return "Desactivado";
    return "Activo";
  };

  const handleButtonLogout = async () => {
    const confirm = await showConfirmModalAlert("¿Seguro que quieres cerrar sesión?");
    if (!confirm) return;
    handleLogout();
  };

  const handleChangeAddress = () => {
    navigation.reset({
      index: 2,
      routes: [
        { name: "Home" },
        { name: "Profile" },
        { name: "ChangeAddress" }
      ]
    });
  };

  const styles = StyleSheet.create({
    profileCard: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: screenWidth > 375 ? 25 : 20, // Responsive padding
      alignItems: "center",
      width: "100%",
      maxWidth: 500, // Maximum width for larger screens
      alignSelf: 'center',
    },
    avatar: {
      width: screenWidth > 375 ? 120 : 100,
      height: screenWidth > 375 ? 120 : 100,
      borderRadius: screenWidth > 375 ? 60 : 50,
      marginBottom: 10,
    },
    userName: {
      fontSize: screenWidth > 375 ? 26 : 24,
      fontWeight: "bold",
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      textAlign: 'center',
    },
    userId: {
      fontSize: screenWidth > 375 ? 18 : 16,
      color: isDarkMode ? secondTextDark : secondTextLight,
      marginBottom: 20,
      textAlign: 'center',
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: screenWidth > 375 ? 15 : 12,
      alignItems: "flex-start",
      minHeight: 25,
    },
    label: {
      color: isDarkMode ? secondTextDark : secondTextLight,
      fontSize: screenWidth > 375 ? 18 : 16,
      flex: 1,
      paddingRight: 10,
    },
    value: {
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      fontSize: screenWidth > 375 ? 18 : 16,
      flex: 2,
      textAlign: "right",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
      marginBottom: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
      borderRadius: 20,
      padding: 20,
      width: screenWidth * 0.9,
      maxWidth: 400,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? defaultTextDark : defaultTextLight,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 20,
    },
    modalButton: {
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 10,
      minWidth: 100,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#6c757d',
    },
    confirmButton: {
      backgroundColor: '#007bff',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    iconTouchArea: {
      padding: 5,
      marginLeft: 5,
    },
    labelWithIcon: {
      flexDirection: "row",
      alignItems: "center",
    },
    pickerContainer: {
      width: screenWidth * 0.8,
      maxWidth: 320,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    datePicker: {
      width: '100%',
      height: 200,
    },
  });

  return (
    <ScrollContainer style={{ padding: screenWidth > 375 ? 25 : 20 }}>
      <View style={styles.profileCard}>
        <View style={styles.headerRow}>
          <Pressable 
            style={styles.iconTouchArea}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Icon
              name={isDarkMode ? "light-mode" : "dark-mode"}
              size={30}
              color={isDarkMode ? iconDark : iconLight}
            />
          </Pressable>
          <Pressable 
            style={styles.iconTouchArea}
            onPress={handleButtonLogout}
          >
            <Icon
              name="power-settings-new"
              size={30}
              color={isDarkMode ? iconDark : iconLight}
            />
          </Pressable>
        </View>

        <Icon
          name="account-circle"
          size={screenWidth > 375 ? 140 : 120}
          color={isDarkMode ? iconDark : iconLight}
        />
        
        <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.userId}>{user.id_number}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Rol</Text>
          <Text style={styles.value}>{formatRole(user.role)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Estado</Text>
          <Text style={styles.value}>{formatStatus(user.status)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{user.plan ? user.plan?.name : "N/A"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Jubilado</Text>
          <Text style={styles.value}>{user.is_retired ? "Si" : "No"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.value}>{user.phone ? user.phone : "N/A"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Familia</Text>
          <Text style={styles.value}>{user.family ? user.family?.name : "N/A"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.labelWithIcon}>
            <Text style={styles.label}>Dirección</Text>
            <Pressable 
              style={styles.iconTouchArea}
              onPress={handleChangeAddress}
            >
              <Icon
                name="edit"
                size={22}
                color={isDarkMode ? iconDark : iconLight}
              />
            </Pressable>
          </View>
          <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
            {user.address ? `${user.address?.address} ${user.address?.city} ${user.address?.state}` : "N/A"}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.labelWithIcon}>
            <Text style={styles.label}>Nacimiento</Text>
            <Pressable 
              style={styles.iconTouchArea}
              onPress={openDatePicker}
            >
              <Icon
                name="edit"
                size={22}
                color={isDarkMode ? iconDark : iconLight}
              />
            </Pressable>
          </View>
          <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
            {user.birth_date ? formatDate(user.birth_date) : "N/A"}
          </Text>
        </View>

        <TouchableButton
          title="Cambiar contraseña"
          onPress={handleChangePassword}
          style={{ marginTop: 20, width: '100%' }}
        />
      </View>

      <DatePickerModal {...{ showPicker, closeDatePicker, styles, screenWidth, handleConfirm, isDarkMode, onDateChange, tempDate, user }} />
    </ScrollContainer>
  );
}