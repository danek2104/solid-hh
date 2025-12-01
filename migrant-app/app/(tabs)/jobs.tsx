import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, Job } from '../../store/userStore'; // Updated type
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function JobsTab() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'search' | 'applied'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
        const response = await api.get('/jobs');
        setJobs(response.data);
    } catch (error) {
        console.error("Failed to fetch jobs", error);
    } finally {
        setLoading(false);
    }
  };

  const fetchApplications = async () => {
      if (!user?.id) return;
      try {
          const response = await api.get(`/applications/user/${user.id}`);
          setMyApplications(response.data);
      } catch (error) {
          console.error("Failed to fetch applications", error);
      }
  };

  useEffect(() => {
    fetchJobs();
    if (user?.id) fetchApplications();
  }, [user]);

  const handleApply = async (jobId: number) => {
      if (!user?.id) return;
      try {
          await api.post('/applications', {
              job_id: jobId,
              user_id: user.id,
              cover_letter: "I am interested in this job."
          });
          fetchApplications(); // Refresh list
          alert(t('applied'));
      } catch (error) {
          alert("Error applying for job");
          console.error(error);
      }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to check if applied
  const isApplied = (jobId: number) => myApplications.some(app => app.job_id === jobId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
            placeholder={t('searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
        />
        
        <View style={styles.tabs}>
            <Chip 
                selected={activeTab === 'search'} 
                onPress={() => setActiveTab('search')}
                style={styles.tabChip}
                showSelectedOverlay
            >
                {t('allJobs')}
            </Chip>
            <Chip 
                selected={activeTab === 'applied'} 
                onPress={() => setActiveTab('applied')}
                style={styles.tabChip}
                showSelectedOverlay
            >
                {t('myApplications')} ({myApplications.length})
            </Chip>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchJobs} />}
      >
        {loading ? (
             <ActivityIndicator animating={true} size="large" style={{marginTop: 20}} />
        ) : activeTab === 'search' ? (
            <>
                {filteredJobs.map(job => (
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
                                mode={isApplied(job.id) ? "outlined" : "contained"}
                                onPress={() => handleApply(job.id)}
                                disabled={isApplied(job.id)}
                            >
                                {isApplied(job.id) ? t('applied') : t('apply')}
                            </Button>
                        </Card.Actions>
                    </Card>
                ))}
            </>
        ) : (
             <>
                {myApplications.length === 0 ? (
                    <Text style={{textAlign: 'center', marginTop: 40, color: '#666'}}>{t('noApplications')}</Text>
                ) : (
                    myApplications.map(app => (
                        <Card key={app.id} style={styles.card}>
                            <Card.Content>
                                <View style={{flexDirection: 'row', justifyContent:'space-between'}}>
                                     <Text variant="titleMedium" style={{fontWeight: 'bold'}}>{app.job_title}</Text>
                                     <Chip icon="clock-outline" style={{backgroundColor: '#FFF3E0'}}>{app.status}</Chip>
                                </View>
                                <Text variant="bodySmall" style={{marginTop: 8}}>{t('applied')}: {new Date(app.created_at).toLocaleDateString()}</Text>
                            </Card.Content>
                        </Card>
                    ))
                )}
             </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  tabs: {
      flexDirection: 'row',
      gap: 8,
  },
  tabChip: {
      flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  }
});