import React, { useState, useContext } from "react";
import { View, Modal, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { GymContext } from "../../context/GymContext";
import { getThemeColors } from "../../constants/UI/theme";

export default function DatePickerModal({ visible, value, onConfirm, onCancel, minimumDate, maximumDate }) {
    const [tempDate, setTempDate] = useState(value || new Date());
    const { isDarkMode } = useContext(GymContext);
    const t = getThemeColors(isDarkMode);

    const handleChange = (_event, selectedDate) => {
        if (Platform.OS === "android") {
            if (_event.type === "dismissed") {
                onCancel();
            } else {
                onConfirm(selectedDate);
            }
            return;
        }
        if (selectedDate) setTempDate(selectedDate);
    };

    if (!visible) return null;

    if (Platform.OS === "android") {
        return (
            <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="default"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
            />
        );
    }

    return (
        <Modal transparent animationType="slide" visible={visible}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: t.secondBackground }]}>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={onCancel}>
                            <Text style={[styles.buttonText, { color: t.buttonTextCancel }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onConfirm(tempDate)}>
                            <Text style={[styles.buttonText, { color: t.buttonTextConfirm }]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={handleChange}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        textColor={t.text}
                        themeVariant={isDarkMode ? "dark" : "light"}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    container: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 25,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: "600",
        marginHorizontal: 25,
    },
});
