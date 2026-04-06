import React, { useContext, useState } from "react";
import {
  Modal,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { GymContext } from "../../context/GymContext";
import { getThemeColors } from "../../constants/UI/theme";

export default function PickerSelect({
  value,
  onValueChange,
  items,
  style,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);
  const { isDarkMode } = useContext(GymContext);
  const t = getThemeColors(isDarkMode);

  const selectedItem = items.find((item) => item.value === value);
  const displayLabel =
    selectedItem?.label || placeholder || "Seleccionar...";

  const handleSelect = (item, index) => {
    onValueChange(item.value, index);
    setVisible(false);
  };

  const styles = getStyles(t);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedItem && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Icon name="arrow-drop-down" size={24} color={t.secondText} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={items}
              keyExtractor={(item, i) =>
                item.key != null ? String(item.key) : String(i)
              }
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item, index)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Icon name="check" size={20} color={t.buttonTextConfirm} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const getStyles = (t) =>
  StyleSheet.create({
    trigger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: 20,
      borderColor: t.secondText,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    triggerText: {
      fontSize: 18,
      color: t.text,
      flex: 1,
    },
    placeholderText: {
      color: t.secondText,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdown: {
      width: "80%",
      maxHeight: "60%",
      backgroundColor: t.secondBackground,
      borderRadius: 16,
      paddingVertical: 8,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    optionSelected: {
      backgroundColor: t.background,
    },
    optionText: {
      fontSize: 18,
      color: t.text,
    },
    optionTextSelected: {
      fontWeight: "600",
      color: t.buttonTextConfirm,
    },
  });
