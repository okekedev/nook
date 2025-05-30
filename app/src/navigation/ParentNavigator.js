import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Import parent screens
import DashboardScreen from '../screens/parent/DashboardScreen';
import FamilyDetailsScreen from '../screens/parent/FamilyDetailsScreen';
import DeviceDetailsScreen from '../screens/parent/DeviceDetailsScreen';
import ProfileCreationScreen from '../screens/parent/ProfileCreationScreen';
import ProfileDetailsScreen from '../screens/parent/ProfileDetailsScreen';
import EnrollmentQRScreen from '../screens/parent/EnrollmentQRScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Dashboard stack navigator
const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6C63FF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'My Families' }} 
      />
      <Stack.Screen 
        name="FamilyDetails" 
        component={FamilyDetailsScreen} 
        options={({ route }) => ({ title: route.params?.familyName || 'Family Details' })} 
      />
      <Stack.Screen 
        name="DeviceDetails" 
        component={DeviceDetailsScreen} 
        options={({ route }) => ({ title: route.params?.deviceName || 'Device Details' })} 
      />
      <Stack.Screen 
        name="ProfileCreation" 
        component={ProfileCreationScreen} 
        options={{ title: 'Create Profile' }} 
      />
      <Stack.Screen 
        name="ProfileDetails" 
        component={ProfileDetailsScreen} 
        options={({ route }) => ({ title: route.params?.profileName || 'Profile Details' })} 
      />
      <Stack.Screen 
        name="EnrollmentQR" 
        component={EnrollmentQRScreen} 
        options={{ title: 'Enrollment QR Code' }} 
      />
    </Stack.Navigator>
  );
};

// Settings stack navigator
const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6C63FF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
    </Stack.Navigator>
  );
};

// Parent tab navigator
const ParentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          paddingTop: 5,
          paddingBottom: 5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStack} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack} 
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default ParentNavigator;