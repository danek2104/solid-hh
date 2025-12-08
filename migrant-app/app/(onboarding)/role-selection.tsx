import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'employer' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useUserStore();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleContinue = async () => {
    if (!selectedRole || !user?.id) return;
    
    setLoading(true);
    try {
      console.log('RoleSelection: Saving role...', selectedRole);
      // Update role on backend
      await api.put(`/users/${user.id}`, { role: selectedRole });
      
      // Update local store
      updateProfile({ role: selectedRole });

      console.log('RoleSelection: Navigating to personal-info');
      // Navigate to Personal Info for both roles to complete profile
      // Using push to ensure we land on the correct screen
      router.push('/(onboarding)/personal-info');

    } catch (error) {
      console.error('RoleSelection Error:', error);
      alert('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ role, icon, title, description }: { role: 'seeker' | 'employer', icon: string, title: string, description: string }) => {
      const isSelected = selectedRole === role;
      return (
        <TouchableOpacity onPress={() => setSelectedRole(role)} activeOpacity={0.8}>
            <Surface style={[
                styles.card, 
                { backgroundColor: theme.surface, borderColor: isSelected ? theme.primary : 'transparent', borderWidth: 2 }
            ]} elevation={2}>
                <View style={[styles.iconContainer, { backgroundColor: isSelected ? theme.primary : theme.background }]}>
                    <FontAwesome5 name={icon} size={32} color={isSelected ? '#fff' : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.text }}>{title}</Text>
                    <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>{description}</Text>
                </View>
                {isSelected && <FontAwesome5 name="check-circle" size={24} color={theme.primary} />}
            </Surface>
        </TouchableOpacity>
      );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
                {t('whoAreYou')}
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('chooseAccountType')}
            </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.cardsContainer}>
            <RoleCard 
                role="seeker"
                icon="user-alt"
                title={t('roleSeekerTitle')}
                description={t('roleSeekerDesc')}
            />
            
            <RoleCard 
                role="employer"
                icon="building"
                title={t('roleEmployerTitle')}
                description={t('roleEmployerDesc')}
            />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
            <PrimaryButton 
                title={t('continue')} 
                onPress={handleContinue} 
                disabled={!selectedRole || loading}
                loading={loading}
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
    padding: 24,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
  },
  cardsContainer: {
      gap: 16,
  },
  card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 16,
      gap: 16,
  },
  iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
  },
  footer: {
      marginTop: 'auto',
      paddingTop: 20,
  }
});
