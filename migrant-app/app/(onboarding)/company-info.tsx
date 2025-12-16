import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useColorScheme } from '@/components/useColorScheme';

export default function CompanyInfoScreen() {
  const router = useRouter();
  const { user, updateProfile, completeOnboarding } = useUserStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [form, setForm] = useState({
    companyName: user?.companyName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    companyDescription: user?.companyDescription || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    let newErrors: Record<string, string> = {};
    if (!form.companyName.trim()) newErrors.companyName = t('requiredField');
    if (!form.email.trim()) newErrors.email = t('requiredField');
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email.trim() && !emailRegex.test(form.email)) newErrors.email = t('invalidEmail');

    if (!form.phone.trim()) newErrors.phone = t('requiredField');
    if (!form.companyDescription.trim()) newErrors.companyDescription = t('requiredField');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validate()) {
        setSaving(true);
        try {
            if (user?.id) {
                const updatePayload = {
                    company_name: form.companyName,
                    email: form.email,
                    phone: form.phone,
                    company_description: form.companyDescription,
                    // Ensure first_name/last_name don't block if they are null in DB now
                    first_name: user.firstName || 'Employer', 
                };

                await api.put(`/users/${user.id}`, updatePayload);
            }
            
            const profileData = {
                ...form,
            };
            updateProfile(profileData);
            
            // Navigate to pending approval screen
            completeOnboarding();
            router.replace('/(onboarding)/employer-pending'); 
            
        } catch (error) {
            console.error("Failed to save company profile", error);
            alert("Error saving profile. Please try again.");
        } finally {
            setSaving(false);
        }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ProgressBar progress={0.5} color={theme.primary} style={styles.progress} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text variant="headlineSmall" style={[styles.header, { color: theme.text }]}>
                {t('companyInfo')}
            </Text>
            <Text variant="bodyMedium" style={[styles.subHeader, { color: theme.textSecondary }]}>
                {t('fillCompanyData')}
            </Text>
            
            <CustomInput 
                label={t('companyName')} 
                value={form.companyName} 
                onChangeText={(text) => setForm({...form, companyName: text})} 
                error={errors.companyName} 
            />

            <CustomInput 
                label={t('email')} 
                value={form.email} 
                onChangeText={(text) => setForm({...form, email: text})} 
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email} 
            />

            <CustomInput 
                label={t('phone')} 
                value={form.phone} 
                onChangeText={(text) => setForm({...form, phone: text})} 
                keyboardType="phone-pad"
                error={errors.phone} 
            />

            <CustomInput 
                label={t('companyDescription')} 
                value={form.companyDescription} 
                onChangeText={(text) => setForm({...form, companyDescription: text})} 
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top' }}
                placeholder={t('collaborationPlaceholder')}
                error={errors.companyDescription} 
            />

            <PrimaryButton 
              title={t('completeRegistration')} 
              onPress={handleNext} 
              loading={saving} 
              disabled={saving}
              style={styles.button}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: { height: 4 },
  content: { padding: 24 },
  header: { fontWeight: '800', marginBottom: 8 },
  subHeader: { marginBottom: 24 },
  button: { marginTop: 24, marginBottom: 48 },
});
