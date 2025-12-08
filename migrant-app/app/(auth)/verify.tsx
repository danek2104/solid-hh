import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useColorScheme } from '@/components/useColorScheme';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const { login } = useUserStore(); 
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleVerify = async () => {
    if (!phone) {
      alert("No phone number provided");
      return;
    }

    if (code !== '0000') {
      alert('Invalid Code (use 0000)');
      return;
    }

    setLoading(true);
    try {
        const response = await api.post('/users/login', {
            phone: phone
        });

        const userData = response.data;
        login(userData);
        
        const isProfileFilled = !!(userData.first_name && userData.last_name && userData.first_name !== 'Test' && userData.first_name !== 'Новый');

        if (isProfileFilled) {
             if (userData.role === 'employer') {
                 router.replace('/(employer)/(tabs)/my-jobs');
             } else {
                 router.replace('/(tabs)/jobs');
             }
        } else {
             // If profile not filled, start onboarding with role selection
             router.replace('/(onboarding)/role-selection');
        }

    } catch (error: any) {
        console.error(error);
        if (error.response && error.response.status === 404) {
             alert('User not found.');
        } else {
            alert("Login failed. Check network/backend.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.text }]}>
                {t('verifyTitle')}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('verifyText')} {phone}
            </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <CustomInput
            placeholder="0000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={4}
            style={styles.input}
            textAlign="center"
            />

            <PrimaryButton 
            title={t('login')} 
            onPress={handleVerify} 
            loading={loading}
            disabled={loading || code.length < 4}
            style={styles.button}
            />
            
            <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.linkButton}
            >
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
                {t('changePhone')}
            </Text>
            </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  title: {
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 26,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  }
});
