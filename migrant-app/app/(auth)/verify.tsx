import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const { login } = useUserStore(); // Destructure login
  const { t } = useTranslation();

  const handleVerify = async () => {
    if (!phone) {
      alert("No phone number provided");
      return;
    }

    // Mock Verification: 0000 passes
    if (code !== '0000') {
      alert('Invalid Code (use 0000)');
      return;
    }

    setLoading(true);
    try {
        // Call Backend to get/login user
        const response = await api.post('/users/login', {
            phone: phone
        });

        // Backend returns User object
        const userData = response.data;
        
        // Update store
        login(userData);

        // Check if we should skip onboarding
        // The store 'login' logic now sets hasCompletedOnboarding based on fields.
        // However, getting the *updated* state immediately from Zustand outside a component render cycle 
        // can be tricky if we rely on the hook.
        // Simpler to just check the data directly here for routing.
        
        const isProfileFilled = !!(userData.first_name && userData.last_name && userData.first_name !== 'Test');

        if (isProfileFilled) {
             router.replace('/(tabs)/jobs');
        } else {
             router.replace('/(onboarding)/personal-info');
        }

    } catch (error: any) {
        console.error(error);
        if (error.response && error.response.status === 404) {
             // If user not found, normally we register them. 
             // Since we are MVP, let's auto-register or alert.
             // Ideally: router.push('/(onboarding)/personal-info');
             alert('User not found.');
        } else {
            alert("Login failed. Check network/backend.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>{t('verifyTitle')}</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('verifyText')} {phone}
        </Text>

        <TextInput
          label={t('verifyCodeLabel')}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          placeholder="0000"
          maxLength={4}
        />

        <Button 
          mode="contained" 
          onPress={handleVerify} 
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          {t('login')}
        </Button>
        
        <Button 
          mode="text" 
          onPress={() => router.back()} 
          style={{marginTop: 16}}
        >
          {t('changePhone')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  }
});
