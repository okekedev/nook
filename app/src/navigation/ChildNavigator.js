import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import child screens
import ChildDashboardScreen from '../screens/child/ChildDashboardScreen';
import ChildDeviceStatusScreen from '../screens/child/ChildDeviceStatusScreen';

const Stack = createStackNavigator();

const ChildNavigator = () => {
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
        name="ChildDashboard" 
        component={ChildDashboardScreen} 
        options={{ title: 'My Device' }} 
      />
      <Stack.Screen 
        name="DeviceStatus" 
        component={ChildDeviceStatusScreen} 
        options={{ title: 'Device Status' }} 
      />
    </Stack.Navigator>
  );
};

export default ChildNavigator;