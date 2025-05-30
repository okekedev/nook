import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import UserTypeScreen from '../screens/UserTypeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EnrollmentScreen from '../screens/EnrollmentScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="UserType" component={UserTypeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Enrollment" component={EnrollmentScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;