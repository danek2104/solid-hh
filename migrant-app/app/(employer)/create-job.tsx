import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';

export default function CreateJobScreen() {
  const [form, setForm] = useState({
      title: '',
      location: '',
      salary_min: '',
      salary_max: '',
      description: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useUserStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  const handleChange = (key: string, value: string) => {
      // Validate numeric fields
      if (key === 'salary_min' || key === 'salary_max') {
          if (/[^0-9]/.test(value)) return;
      }
      setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
      if (!form.title || !form.salary_min || !form.location) {
          Alert.alert(t('error'), t('requiredField'));
          return;
      }

      if (form.description.length < 50) {
          Alert.alert(t('error'), t('descTooShort') || "Description must be at least 50 characters.");
          return;
      }

      setLoading(true);
      try {
          await api.post('/jobs', {
              ...form,
              salary_min: Number(form.salary_min),
              salary_max: Number(form.salary_max),
              employer_id: user?.id
          });
          router.back();
      } catch (error) {
          console.error(error);
          Alert.alert(t('error'), "Failed to create job");
      } finally {
          setLoading(false);
      }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.text }]}>{t('createVacancy')}</Text>

        <CustomInput
            label={t('jobTitle') + " *"}
            placeholder="e.g. Construction Worker"
            value={form.title}
            onChangeText={(t) => handleChange('title', t)}
        />

        <CustomInput
            label={t('location') + " *"}
            placeholder="e.g. Moscow, Center"
            value={form.location}
            onChangeText={(t) => handleChange('location', t)}
        />
        
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <CustomInput
                    label={t('minSalary') + " (RUB) *"}
                    placeholder="50000"
                    keyboardType="numeric"
                    value={form.salary_min}
                    onChangeText={(t) => handleChange('salary_min', t)}
                />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
                <CustomInput
                    label={t('maxSalary') + " (RUB)"}
                    placeholder="70000"
                    keyboardType="numeric"
                    value={form.salary_max}
                    onChangeText={(t) => handleChange('salary_max', t)}
                />
            </View>
        </View>

        <CustomInput
            label={t('description')}
            placeholder=""
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(t) => handleChange('description', t)}
            style={{ height: 100, textAlignVertical: 'top' }} 
        />

        <PrimaryButton 
            title={t('postJob')} 
            onPress={handleSubmit} 
            loading={loading}
            style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  row: {
      flexDirection: 'row',
  }
});
