import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, Job } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function OnboardingJobsScreen() {
  const router = useRouter();
  const { appliedJobs, applyToJob, completeOnboarding } = useUserStore();
  const { t } = useTranslation();
  
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{fontWeight: 'bold'}}>{t('jobsTitle')}</Text>
        <Text variant="bodyMedium" style={{color: '#666'}}>
          {t('jobsSubtitle')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
           <ActivityIndicator animating={true} size="large" style={{marginTop: 20}} />
        ) : (
           jobs.map(job => (
            <Card key={job.id} style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={{fontWeight: 'bold'}}>{job.title}</Text>
                    <Text variant="bodyMedium" style={{color: '#2E7D32', fontWeight: 'bold', marginTop: 4}}>
                        {job.salary_min} - {job.salary_max} {job.currency}
                    </Text>
                    <Text variant="bodySmall" style={{color: '#666', marginBottom: 8}}>{job.location}</Text>
                    <Text variant="bodySmall" numberOfLines={2}>{job.description}</Text>
                </Card.Content>
                <Card.Actions>
                    <Button 
                        mode={appliedJobs.includes(job.id) ? "outlined" : "contained"}
                        onPress={() => applyToJob(job.id)}
                        disabled={appliedJobs.includes(job.id)}
                    >
                        {appliedJobs.includes(job.id) ? t('applied') : t('apply')}
                    </Button>
                </Card.Actions>
            </Card>
           ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          mode="contained" 
          onPress={handleComplete} 
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('finish')}
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  button: {
  },
  buttonContent: {
    paddingVertical: 8,
  }
});