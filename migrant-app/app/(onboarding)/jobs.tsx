import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, Job } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import Card from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';

export default function OnboardingJobsScreen() {
  const router = useRouter();
  const { appliedJobs, applyToJob, completeOnboarding } = useUserStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleComplete = () => {
    completeOnboarding();
    router.replace('/(tabs)/jobs');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ProgressBar progress={0.75} color={theme.primary} style={styles.progress} />
      <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.text }]}>{t('jobsTitle')}</Text>
        <Text variant="bodyMedium" style={{color: theme.textSecondary}}>
          {t('jobsSubtitle')}
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
           <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary }}>{t('loading', 'Loading jobs...')}</Text>
           </View>
        ) : (
           jobs.map((job, index) => (
            <Animated.View 
                key={job.id} 
                entering={FadeInUp.delay(index * 100).springify()} 
                layout={Layout.springify()}
            >
                <Card style={styles.card}>
                    <View style={styles.cardContent}>
                        <View style={styles.jobHeader}>
                            <Text variant="titleMedium" style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                            <Text style={[styles.salary, { color: '#2E7D32' }]}>
                                {job.salary_min} - {job.salary_max} {job.currency}
                            </Text>
                        </View>
                        
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                            <Text style={[styles.location, { color: theme.textSecondary }]}>{job.location}</Text>
                        </View>

                        <Text style={[styles.description, { color: theme.text }]} numberOfLines={3}>{job.description}</Text>
                        
                        <PrimaryButton 
                            title={appliedJobs.includes(job.id) ? t('applied') : t('apply')}
                            onPress={() => applyToJob(job.id)}
                            variant={appliedJobs.includes(job.id) ? 'secondary' : 'primary'}
                            disabled={appliedJobs.includes(job.id)}
                            style={styles.applyButton}
                            textStyle={{ fontSize: 14 }}
                        />
                    </View>
                </Card>
            </Animated.View>
           ))
        )}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(500)} style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <PrimaryButton 
          title={t('finish')} 
          onPress={handleComplete} 
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progress: {
      height: 4,
  },
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  title: {
      fontWeight: '800',
      marginBottom: 4,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  card: {
    padding: 24,
    marginBottom: 16,
  },
  cardContent: {
    gap: 8,
  },
  jobHeader: {
      marginBottom: 4,
  },
  jobTitle: {
      fontWeight: '800',
      fontSize: 18,
      marginBottom: 4,
  },
  salary: {
      fontWeight: '700',
      fontSize: 15,
      marginBottom: 8,
  },
  locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 12,
  },
  location: {
      fontSize: 14,
  },
  description: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      opacity: 0.8,
  },
  applyButton: {
      height: 44,
      borderRadius: 12,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});