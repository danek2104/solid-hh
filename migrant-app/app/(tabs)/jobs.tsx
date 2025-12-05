import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useUserStore, Job } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';

export default function JobsTab() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'search' | 'applied'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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
          fetchApplications(); 
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

  const isApplied = (jobId: number) => myApplications.some(app => app.job_id === jobId);

  const renderTab = (key: 'search' | 'applied', label: string) => {
      const isActive = activeTab === key;
      return (
          <TouchableOpacity 
            onPress={() => setActiveTab(key)}
            style={[
                styles.tabItem,
                isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
          >
              <Text style={[
                  styles.tabText,
                  { color: isActive ? '#FFF' : theme.textSecondary }
              ]}>
                  {label}
              </Text>
          </TouchableOpacity>
      );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <CustomInput
            placeholder={t('searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            icon="search"
            style={styles.searchBar}
            containerStyle={{ marginBottom: 0 }}
        />
        
        <View style={styles.tabs}>
            {renderTab('search', t('allJobs'))}
            {renderTab('applied', `${t('myApplications')} (${myApplications.length})`)}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchJobs} tintColor={theme.primary} />}
      >
        {loading ? (
             <ActivityIndicator color={theme.primary} size="large" style={{marginTop: 40}} />
        ) : activeTab === 'search' ? (
            <>
                {filteredJobs.map((job, index) => (
                    <Card 
                        key={job.id} 
                        entering={FadeInUp.delay(index * 100).springify()} 
                        layout={Layout.springify()}
                        style={styles.card}
                    >
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
                                title={isApplied(job.id) ? t('applied') : t('apply')}
                                onPress={() => handleApply(job.id)}
                                variant={isApplied(job.id) ? 'secondary' : 'primary'}
                                disabled={isApplied(job.id)}
                                style={styles.applyButton}
                                textStyle={{ fontSize: 14 }}
                            />
                        </View>
                    </Card>
                ))}
            </>
        ) : (
             <>
                {myApplications.length === 0 ? (
                    <Text style={{textAlign: 'center', marginTop: 40, color: theme.textSecondary}}>{t('noApplications')}</Text>
                ) : (
                    myApplications.map((app, index) => (
                        <Card 
                            key={app.id} 
                            entering={FadeInUp.delay(index * 100)}
                            style={styles.card}
                        >
                            <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems: 'center', marginBottom: 8}}>
                                    <Text variant="titleMedium" style={{fontWeight: 'bold', color: theme.text}}>{app.job_title}</Text>
                                    <View style={[styles.statusChip, { backgroundColor: theme.secondary }]}>
                                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>{app.status}</Text>
                                    </View>
                            </View>
                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                {t('applied')}: {new Date(app.created_at).toLocaleDateString()}
                            </Text>
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
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  searchBar: {
    marginBottom: 16,
  },
  tabs: {
      flexDirection: 'row',
      gap: 12,
  },
  tabItem: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      backgroundColor: '#FFF',
  },
  tabText: {
      fontWeight: '600',
      fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 24,
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
  statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
  }
});