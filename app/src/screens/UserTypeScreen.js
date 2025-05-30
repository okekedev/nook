import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const UserTypeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#F6A192']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>I am a...</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.option}
              onPress={() => navigation.navigate('Login', { userType: 'parent' })}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="account-supervisor" size={60} color="#6C63FF" />
              </View>
              <Text style={styles.optionTitle}>Parent</Text>
              <Text style={styles.optionDescription}>
                Create profiles, manage devices, and set restrictions for your children
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.option}
              onPress={() => navigation.navigate('Enrollment')}
            >
              <View style={styles.iconContainer}>
                <FontAwesome5 name="child" size={60} color="#6C63FF" />
              </View>
              <Text style={styles.optionTitle}>Child</Text>
              <Text style={styles.optionDescription}>
                Enroll your device with your parent's setup code
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
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
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserTypeScreen;