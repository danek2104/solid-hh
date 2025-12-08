import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function SuccessScreen() {
  const router = useRouter();
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const { t } = useTranslation();

  const handleFinish = () => {
    completeOnboarding();
    // The index AuthGuard will pick this up and redirect to (tabs)
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
             <MaterialCommunityIcons name="check-circle-outline" size={120} color="#2E7D32" />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>{t('successTitle')}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('successSubtitle')}
        </Text>

        <Button 
          mode="contained" 
          onPress={handleFinish} 
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('goToApp')}
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
    padding: 32,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
      marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
    color: '#666',
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
  }
});
