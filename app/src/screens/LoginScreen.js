import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../utils/AuthContext';
import { auth } from '../utils/api';

const LoginScreen = ({ navigation, route }) => {
  const { userType = 'parent' } = route.params || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Reset error
    setError('');
    setIsLoading(true);

    try {
      // Call login API
      const response = await auth.login(email, password);
      
      // Check user role
      if (response.data.user.role !== userType) {
        setError(`This account is not registered as a ${userType}`);
        setIsLoading(false);
        return;
      }
      
      // Store token and user data
      await signIn(response.data.token, response.data.user);
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.error || 'Invalid email or password');
      } else if (error.request) {
        // The request was made but no response was received
        setError('Network error. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#F6A192']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.content}>
              <Text style={styles.title}>{userType === 'parent' ? 'Parent Login' : 'Child Login'}</Text>
              
              {error ? (
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error}
                </HelperText>
              ) : null}
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ colors: { primary: '#6C63FF' } }}
              />
              
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                theme={{ colors: { primary: '#6C63FF' } }}
              />
              
              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                loading={isLoading}
                disabled={isLoading}
              >
                Login
              </Button>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register', { userType })}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 15,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  registerText: {
    color: '#FFFFFF',
    marginRight: 5,
  },
  registerLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 30,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(235, 87, 87, 0.3)',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default LoginScreen;