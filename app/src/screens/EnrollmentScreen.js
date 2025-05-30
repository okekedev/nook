import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { families } from '../utils/api';

const EnrollmentScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setShowScanner(false);
    
    // Try to extract enrollment code from QR code
    try {
      // Check if the QR code is a URL or just a code
      if (data.startsWith('http')) {
        // Extract code from URL if possible
        const url = new URL(data);
        const code = url.searchParams.get('code');
        if (code) {
          setEnrollmentCode(code);
        } else {
          // Just use the full URL as the enrollment URL
          validateEnrollment(data);
          return;
        }
      } else {
        // Assume the data is the code itself
        setEnrollmentCode(data);
      }
      
      Alert.alert(
        "Code Scanned",
        `Enrollment code scanned successfully! Proceed with enrollment?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Proceed", 
            onPress: () => validateEnrollment(enrollmentCode)
          }
        ]
      );
    } catch (err) {
      setError('Invalid QR code format. Please try again.');
    }
  };

  const validateEnrollment = async (code) => {
    if (!code) {
      setError('Please enter an enrollment code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validate enrollment code
      const response = await families.validateEnrollmentCode(code);
      
      if (response.data.valid) {
        // Show instructions for MDM enrollment
        Alert.alert(
          "Enrollment Confirmed",
          `You're about to enroll your device in ${response.data.enrollment.familyName}. You'll be redirected to the iOS MDM enrollment process. Continue?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsLoading(false)
            },
            { 
              text: "Continue", 
              onPress: () => {
                setIsLoading(false);
                // In a real app, redirect to the enrollment URL
                // For now, just show a success message
                Alert.alert(
                  "Success",
                  "Your device is now ready to be enrolled. Please follow the instructions on the MDM enrollment screen.",
                  [
                    { text: "OK" }
                  ]
                );
              }
            }
          ]
        );
      } else {
        setError('Invalid enrollment code');
      }
    } catch (error) {
      console.error('Enrollment validation error:', error);
      
      if (error.response) {
        setError(error.response.data.error || 'Invalid enrollment code');
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderCamera = () => {
    if (hasPermission === null) {
      return <Text style={styles.cameraText}>Requesting camera permission...</Text>;
    }
    if (hasPermission === false) {
      return <Text style={styles.cameraText}>No access to camera. Please enable camera access in your device settings.</Text>;
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
          }}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
          </View>
          <TouchableOpacity 
            style={styles.closeScannerButton}
            onPress={() => {
              setShowScanner(false);
              setScanned(false);
            }}
          >
            <Text style={styles.closeScannerButtonText}>Close</Text>
          </TouchableOpacity>
        </Camera>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#F6A192']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {showScanner ? (
            renderCamera()
          ) : (
            <>
              <Text style={styles.title}>Device Enrollment</Text>
              <Text style={styles.subtitle}>Enter the enrollment code provided by your parent</Text>
              
              {error ? (
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error}
                </HelperText>
              ) : null}
              
              <TextInput
                label="Enrollment Code"
                value={enrollmentCode}
                onChangeText={setEnrollmentCode}
                mode="outlined"
                style={styles.input}
                keyboardType="number-pad"
                theme={{ colors: { primary: '#6C63FF' } }}
              />
              
              <Button
                mode="contained"
                onPress={() => validateEnrollment(enrollmentCode)}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                loading={isLoading}
                disabled={isLoading}
              >
                Verify Code
              </Button>
              
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => {
                  setShowScanner(true);
                  setScanned(false);
                }}
              >
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  scanButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  backButton: {
    marginTop: 20,
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
  cameraContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
  },
  closeScannerButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 20,
  },
  closeScannerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EnrollmentScreen;