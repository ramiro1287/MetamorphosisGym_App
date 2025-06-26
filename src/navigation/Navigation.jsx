import React, { useContext } from "react";
import { StatusBar } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { GymContext } from "../context/GymContext";
import Toast from "react-native-toast-message";
import { getToastConfig } from "../components/Toast/Toast";
import {
  mainBackgroundDark, mainBackgroundLight,
} from "../constants/UI/colors";

// ------------------------------------------------- Screens
import Navbar from "../components/Navbar/Navbar";

// ------------------------------------------------- Home Screen
import Home from "../screens/Home/Home";
// Trainee Screens
import TraineePayments from "../screens/Home/Trainee/TraineePayments";
import TraineePlans from "../screens/Home/Trainee/TraineePlans";
import PaymentDetail from "../screens/Home/Trainee/PaymentDetail";
// Admin Users Screens
import AdminUsers from "../screens/Home/Admin/Users/AdminUsers";
import AdminUserDetail from "../screens/Home/Admin/Users/AdminUserDetail";
import AdminCreateUser from "../screens/Home/Admin/Users/AdminCreateUser";
import AdminUserPlans from "../screens/Home/Admin/Users/AdminUserPlans";
// Admin Families Screens
import AdminFamilies from "../screens/Home/Admin/Families/AdminFamilies";
import AdminFamilyDetail from "../screens/Home/Admin/Families/AdminFamilyDetail";
import AdminFamilyAdd from "../screens/Home/Admin/Families/AdminFamilyAdd";
// Admin Payments Screens
import AdminUserPayments from "../screens/Home/Admin/Payments/AdminUserPayments";
import AdminUserPaymentDetail from "../screens/Home/Admin/Payments/AdminUserPaymentDetail";
// Admin TrainingPlans Screens
import AdminUserTrainingPlans from "../screens/Home/Admin/TrainingPlans/AdminUserTrainingPlans";
import AdminUserTrainingPlanCreate from "../screens/Home/Admin/TrainingPlans/AdminUserTrainingPlanCreate";
import AdminUserTrainingPlanDetail from "../screens/Home/Admin/TrainingPlans/AdminUserTrainingPlanDetail";
// Admin Statistics Screens
import AdminStatistics from "../screens/Home/Admin/Statistics/AdminStatistics";


// ------------------------------------------------- Profile Screens
import Profile from "../screens/Profile/Profile";
import ChangePassword from "../screens/Profile/ChangePassword";
import ChangeAddress from "../screens/Profile/ChangeAddress";

const Stack = createStackNavigator();

export default function Navigation() {
  const { isDarkMode } = useContext(GymContext);

  return (
    <NavigationContainer>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content" }
        translucent={true}
      />
      <Stack.Navigator screenOptions={{
        header: () => <Navbar />,
        cardStyle: { backgroundColor: isDarkMode ? mainBackgroundDark : mainBackgroundLight },
      }}>
        {/* Home */}
        <Stack.Screen name="Home" component={Home} />
        {/* Trainee Families Screens */}
        <Stack.Screen name="TraineePayments" component={TraineePayments} />
        <Stack.Screen name="TraineePlans" component={TraineePlans} />
        <Stack.Screen name="PaymentDetail" component={PaymentDetail} />
        {/* Admin Users Screens */}
        <Stack.Screen name="AdminUsers" component={AdminUsers} />
        <Stack.Screen name="AdminUserDetail" component={AdminUserDetail} />
        <Stack.Screen name="AdminCreateUser" component={AdminCreateUser} />
        <Stack.Screen name="AdminUserPlans" component={AdminUserPlans} />
        {/* Admin Families Screens */}
            <Stack.Screen name="AdminFamilies" component={AdminFamilies} />
        <Stack.Screen name="AdminFamilyDetail" component={AdminFamilyDetail} />
        <Stack.Screen name="AdminFamilyAdd" component={AdminFamilyAdd} />
        {/* Admin Payments Screens */}
        <Stack.Screen name="AdminUserPayments" component={AdminUserPayments} />
        <Stack.Screen name="AdminUserPaymentDetail" component={AdminUserPaymentDetail} />
        {/* Admin TrainingPlans Screens */}
        <Stack.Screen name="AdminUserTrainingPlans" component={AdminUserTrainingPlans} />
        <Stack.Screen name="AdminUserTrainingPlanCreate" component={AdminUserTrainingPlanCreate} />
        <Stack.Screen name="AdminUserTrainingPlanDetail" component={AdminUserTrainingPlanDetail} />
        {/* Admin Statistics Screens */}
        <Stack.Screen name="AdminStatistics" component={AdminStatistics} />

        {/* Profile */}
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="ChangeAddress" component={ChangeAddress} />
      </Stack.Navigator>
      <Toast config={getToastConfig(isDarkMode)} />
    </NavigationContainer>
  );
}
