import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Switch, Badge } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { JobDetailsSkeleton } from '@/components/LoadingSkeletons';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form State
  const [formData, setFormData] = useState({
    title: '',
    salary_min: '',
    salary_max: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
      setFormData({
        title: res.data.title,
        salary_min: String(res.data.salary_min),
        salary_max: String(res.data.salary_max),
        location: res.data.location,
        description: res.data.description,
      });
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), t('failedToLoadJob'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.salary_min || !formData.description) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (formData.description.length < 50) {
        Alert.alert(t('error'), t('descTooShort') || "Description must be at least 50 characters.");
        return;
    }

    setSaving(true);
    try {
      const updatedJob = await api.put(`/jobs/${id}`, {
        ...formData,
        salary_min: Number(formData.salary_min),
        salary_max: Number(formData.salary_max),
      });
      // Preserve application_count which is not returned by PUT usually, or ensure it is
      setJob({ ...updatedJob.data, application_count: job.application_count });
      setIsEditing(false);
      Alert.alert(t('success'), t('jobUpdated'));
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), t('updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!job) return;
    const newStatus = !job.is_active;
    try {
      await api.put(`/jobs/${id}`, { is_active: newStatus });
      setJob({ ...job, is_active: newStatus });
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), t('updateFailed'));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('deleteJob'),
      t('deleteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/jobs/${id}`);
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert(t('error'), t('deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const navigateToCandidates = () => {
      // Navigate to candidates tab with this job selected
      // We can use a global store or params. For now, we'll just go to the tab.
      // Ideally, we pass a param to filter by this job.
      // Since tabs don't easily accept params in Expo Router v2/v3 without strict typing, 
      // we might rely on the store if we implemented it, or just navigate.
      // For this MVP, we will navigate to candidates.
      router.push('/(employer)/(tabs)/candidates');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.text }]}>
            {t('jobDetails')}
            </Text>
            <View style={{ width: 24 }} />
        </View>
        <JobDetailsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.text }]}>
           {isEditing ? t('editJob') : t('jobDetails')}
        </Text>
        <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
          <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>
            {isEditing ? t('save') : t('edit')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Statistics / Status Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
            <Card style={styles.card}>
                <View style={styles.rowBetween}>
                     {/* Status Toggle */}
                    <View style={styles.row}>
                        <Ionicons 
                            name={job.is_active ? "checkmark-circle" : "close-circle"} 
                            size={24} 
                            color={job.is_active ? "green" : "gray"} 
                        />
                        <Text style={[styles.statusText, { color: theme.text }]}>
                            {job.is_active ? t('active') : t('closed')}
                        </Text>
                    </View>
                    <Switch 
                        value={job.is_active} 
                        onValueChange={toggleStatus} 
                        color={theme.primary} 
                    />
                </View>

                <View style={styles.divider} />
                
                {/* Applications Count */}
                <TouchableOpacity onPress={navigateToCandidates} style={styles.statsRow}>
                    <View style={styles.row}>
                        <Ionicons name="people" size={20} color={theme.textSecondary} />
                        <Text style={{ marginLeft: 8, color: theme.text, fontSize: 16 }}>
                            {t('applications') || "Applications"}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.primary, marginRight: 8 }}>
                            {job.application_count || 0}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </View>
                </TouchableOpacity>
            </Card>
        </Animated.View>

        {/* Main Info Form */}
        <Animated.View entering={FadeInDown.delay(200)}>
            <Card style={styles.card}>
                <CustomInput
                    label={t('jobTitle')}
                    value={isEditing ? formData.title : job.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    editable={isEditing}
                    style={isEditing ? styles.input : styles.readOnlyInput}
                />

                <View style={styles.rowInputs}>
                    <CustomInput
                        label={t('salaryMin')}
                        value={isEditing ? formData.salary_min : String(job.salary_min)}
                        onChangeText={(text) => {
                            if (/^\d*$/.test(text)) setFormData({ ...formData, salary_min: text })
                        }}
                        editable={isEditing}
                        keyboardType="numeric"
                        style={isEditing ? styles.input : styles.readOnlyInput}
                    />
                     <CustomInput
                        label={t('salaryMax')}
                        value={isEditing ? formData.salary_max : String(job.salary_max)}
                        onChangeText={(text) => {
                            if (/^\d*$/.test(text)) setFormData({ ...formData, salary_max: text })
                        }}
                        editable={isEditing}
                        keyboardType="numeric"
                        containerStyle={{ flex: 1 }}
                        style={isEditing ? styles.input : styles.readOnlyInput}
                    />
                </View>

                <CustomInput
                    label={t('location')}
                    value={isEditing ? formData.location : job.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    editable={isEditing}
                    style={isEditing ? styles.input : styles.readOnlyInput}
                />
            </Card>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300)}>
             <Card style={styles.card}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.text }}>
                    {t('description')}
                </Text>
                {isEditing ? (
                    <CustomInput
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        multiline
                        numberOfLines={6}
                        style={{ height: 150, textAlignVertical: 'top' }}
                    />
                ) : (
                    <Text style={{ color: theme.text, lineHeight: 22 }}>{job.description}</Text>
                )}
             </Card>
        </Animated.View>

        {/* Delete Button */}
        <Animated.View entering={FadeInDown.delay(400)}>
            <PrimaryButton
                title={t('deleteJob')}
                onPress={handleDelete}
                variant="outline"
                style={{ borderColor: theme.error, marginTop: 20 }}
                textStyle={{ color: theme.error }}
            />
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 16, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  rowInputs: { flexDirection: 'row' },
  input: { backgroundColor: '#F5F5F5' },
  readOnlyInput: { borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
});