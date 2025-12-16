import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmployerPendingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.iconContainer}>
            <MaterialCommunityIcons name="clock-check-outline" size={100} color={theme.primary} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
                {t('thankYou')}
            </Text>
            <Text variant="bodyLarge" style={[styles.message, { color: theme.textSecondary }]}>
                {t('employerPendingMessage')}
            </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
            <PrimaryButton 
                title={t('backToLogin')} 
                onPress={() => router.replace('/')} 
                variant="outline"
            />
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
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  footer: {
      width: '100%',
  }
});
