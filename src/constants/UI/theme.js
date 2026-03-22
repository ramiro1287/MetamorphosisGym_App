import { StyleSheet } from "react-native";
import {
  mainBackgroundDark, mainBackgroundLight,
  secondBackgroundDark, secondBackgroundLight,
  navbarBackgroundDark, navbarBackgroundLight,
  iconDark, iconLight,
  buttonBackgroundDark, buttonBackgroundLight,
  defaultTextDark, defaultTextLight,
  shadowCardDark, shadowCardLight,
  secondTextDark, secondTextLight,
  errorButtonTextDark, errorButtonTextLight,
  buttonBorderDark, buttonBorderLight,
  buttonTextConfirmDark, buttonTextConfirmLight,
  buttonTextCancelDark, buttonTextCancelLight,
  inputErrorDark, inputErrorLight,
} from "./colors";

export const getThemeColors = (isDarkMode) => ({
  text: isDarkMode ? defaultTextDark : defaultTextLight,
  secondText: isDarkMode ? secondTextDark : secondTextLight,
  background: isDarkMode ? mainBackgroundDark : mainBackgroundLight,
  secondBackground: isDarkMode ? secondBackgroundDark : secondBackgroundLight,
  icon: isDarkMode ? iconDark : iconLight,
  inputError: isDarkMode ? inputErrorDark : inputErrorLight,
  buttonBackground: isDarkMode ? buttonBackgroundDark : buttonBackgroundLight,
  buttonText: isDarkMode ? defaultTextLight : defaultTextDark,
  navbar: isDarkMode ? navbarBackgroundDark : navbarBackgroundLight,
  shadow: isDarkMode ? shadowCardDark : shadowCardLight,
  buttonBorder: isDarkMode ? buttonBorderDark : buttonBorderLight,
  buttonTextConfirm: isDarkMode ? buttonTextConfirmDark : buttonTextConfirmLight,
  buttonTextCancel: isDarkMode ? buttonTextCancelDark : buttonTextCancelLight,
  errorButton: isDarkMode ? errorButtonTextDark : errorButtonTextLight,
});

export const getCommonStyles = (isDarkMode) => {
  const t = getThemeColors(isDarkMode);

  return {
    ...StyleSheet.create({
      // Screen title
      titleText: {
        fontSize: 22,
        color: t.text,
        marginBottom: 10,
        alignSelf: "center",
      },
      // Card with secondary background
      cardContainer: {
        backgroundColor: t.secondBackground,
        borderRadius: 20,
        padding: 15,
        width: "100%",
        marginBottom: 20,
      },
      // Card with lateral borders
      cardContainerBordered: {
        backgroundColor: t.secondBackground,
        borderColor: t.text,
        borderRadius: 20,
        padding: 15,
        width: "100%",
        marginBottom: 20,
        borderRightWidth: 3,
        borderLeftWidth: 3,
      },
      // Row inside a card (horizontal)
      cardRowContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
      },
      // Card row label
      cardRowTitle: {
        fontSize: 16,
        color: t.secondText,
        marginRight: 6,
        flexShrink: 1,
      },
      // Card row value
      cardRowText: {
        fontSize: 18,
        color: t.text,
        marginLeft: 6,
        flex: 1,
        flexShrink: 1,
      },
      // Profile-style info row (space-between)
      infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 10,
        alignItems: "flex-start",
        flexWrap: "wrap",
      },
      // Profile-style label
      label: {
        color: t.secondText,
        fontSize: 18,
      },
      // Profile-style value
      value: {
        color: t.text,
        fontSize: 18,
        flex: 1,
        textAlign: "right",
      },
      // Profile card container
      profileCard: {
        backgroundColor: t.secondBackground,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        width: "100%",
      },
      // Error text
      errorText: {
        color: t.inputError,
        marginBottom: 8,
        fontSize: 16,
      },
      // Form text input (bottom border)
      input: {
        height: 40,
        borderBottomWidth: 1,
        borderColor: t.text,
        marginBottom: 10,
        paddingHorizontal: 8,
        width: "80%",
        fontSize: 18,
        color: t.text,
      },
      // Input error state
      inputError: {
        borderColor: t.inputError,
      },
      // Search/filter input (bordered box)
      searchInput: {
        borderWidth: 1,
        borderColor: t.secondText,
        color: t.text,
        backgroundColor: t.secondBackground,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
      },
      // Modal overlay
      modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      // Modal card
      modalCardContainer: {
        backgroundColor: t.secondBackground,
        borderColor: t.text,
        borderWidth: 1.5,
        padding: 20,
        borderRadius: 12,
        width: "80%",
      },
      // Modal title
      modalCardTitle: {
        fontSize: 18,
        marginBottom: 10,
        color: t.text,
        alignSelf: "center",
      },
      // Modal buttons row
      modalCardButtonsContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
      },
      // Modal text input
      modalCardTextInput: {
        color: t.text,
        borderBottomWidth: 1,
        borderColor: t.text,
      },
      // Button grid container
      buttonsSelectorContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 30,
        gap: 20,
      },
      // Create form card
      formCardContainer: {
        backgroundColor: t.secondBackground,
        borderRadius: 20,
        padding: 20,
        paddingTop: 0,
        width: "80%",
      },
      // Form row (horizontal with label)
      formInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
      },
      // Form label
      formInputLabel: {
        fontSize: 18,
        color: t.text,
        marginRight: 10,
      },
      // Form text input (flex, bottom border)
      formInput: {
        flex: 1,
        fontSize: 18,
        color: t.text,
        borderBottomWidth: 1,
        borderColor: t.text,
      },
      // Create/add button at top-right
      createButton: {
        alignSelf: "flex-end",
        paddingVertical: 2,
        paddingHorizontal: 5,
      },
      // Password container
      passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "80%",
        marginBottom: 10,
      },
    }),
    // RNPickerSelect styles (nested object, can't go through StyleSheet.create)
    pickerSelect: {
      inputIOS: {
        fontSize: 18,
        color: t.text,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: t.text,
      },
      inputAndroid: {
        fontSize: 18,
        color: t.text,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: t.text,
      },
    },
  };
};
