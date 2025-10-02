import React, { useRef, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";

export default function ScrollContainer({
  children,
  style = {},
  onEndReached,
  onEndReachedThreshold = 0.5,
  loadingMore = false,
  ListFooterComponent,
  ...props
}) {
  const calledRef = useRef(false);

  const handleScroll = useCallback(
    (e) => {
      if (!onEndReached) return;

      const { layoutMeasurement, contentSize, contentOffset } = e.nativeEvent;

      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);

      const thresholdPx = layoutMeasurement.height * onEndReachedThreshold;

      if (distanceFromBottom > thresholdPx + 50) {
        calledRef.current = false;
      }

      if (
        distanceFromBottom <= thresholdPx &&
        !loadingMore &&
        !calledRef.current
      ) {
        calledRef.current = true;
        onEndReached?.();
      }
    },
    [onEndReached, onEndReachedThreshold, loadingMore]
  );

  const handleContentSizeChange = () => {
    calledRef.current = false;
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, style]}
      keyboardShouldPersistTaps="handled"
      onScroll={handleScroll}
      onContentSizeChange={handleContentSizeChange}
      scrollEventThrottle={16}
      {...props}
    >
      {children}
      {(loadingMore || ListFooterComponent) && (
        <View style={styles.footer}>
          {ListFooterComponent ?? <ActivityIndicator />}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 30,
  },
  footer: {
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
