import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';

// Import navigation
import AuthNavigator from './src/navigation/AuthNavigator';
import ParentNavigator from './src/navigation/ParentNavigator';
import ChildNavigator from './src/navigation/ChildNavigator';

// Import context
import { AuthContext } from './src/utils/AuthContext';

// Define theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C63FF',
    accent: '#F6A192',
    background: '#F9F9F9',
    surface: '#FFFFFF',
    error: '#EB5757',
    text: '#333333',
    placeholder: '#9E9E9E',
  },
  roundness: 10,
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check for stored token on app load
    const bootstrapAsync = async () => {
      let token = null;
      let role = null;

      try {
        token = await SecureStore.getItemAsync('userToken');
        role = await SecureStore.getItemAsync('userRole');
      } catch (e) {
        console.log('Failed to load auth token', e);
      }

      // Update state
      setUserToken(token);
      setUserRole(role);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  // Auth context functions for login/logout
  const authContext = React.useMemo(() => ({
    signIn: async (token, user) => {
      setIsLoading(true);
      try {
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userRole', user.role);
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
      } catch (e) {
        console.log('Failed to save auth token', e);
      }
      setUserToken(token);
      setUserRole(user.role);
      setIsLoading(false);
    },
    signOut: async () => {
      setIsLoading(true);
      try {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('userData');
      } catch (e) {
        console.log('Failed to remove auth token', e);
      }
      setUserToken(null);
      setUserRole(null);
      setIsLoading(false);
    },
    userToken,
    userRole,
    isLoading,
  }), [userToken, userRole, isLoading]);

  if (isLoading) {
    // Return splash screen or loading component
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            {userToken == null ? (
              <AuthNavigator />
            ) : userRole === 'parent' ? (
              <ParentNavigator />
            ) : (
              <ChildNavigator />
            )}
          </NavigationContainer>
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}