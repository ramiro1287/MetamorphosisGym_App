import React from "react";
import {
  ScrollView,
  StyleSheet,
} from "react-native";

export default function ScrollContainer({ children, style = {}, ...props }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.container, style]}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 30,
  },
});
