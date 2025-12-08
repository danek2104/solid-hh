import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useUserStore, Job } from '@/store/userStore';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';
import EmptyState from '@/components/EmptyState';
import { JobCardSkeleton } from '@/components/LoadingSkeletons';

export default function MyJobsScreen() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const isFocused = useIsFocused();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
        const response = await api.get(`/jobs/employer/${user?.id}`);
        setJobs(response.data);
    } catch (error) {
        console.error("Failed to fetch jobs", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && isFocused) {
        fetchMyJobs();
    }
  }, [user, isFocused]);

  const filteredJobs = jobs.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            j.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'active' ? j.is_active : !j.is_active;
      return matchesSearch && matchesTab;
  });

  const renderTab = (key: 'active' | 'closed', label: string) => {
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
            {renderTab('active', t('active'))}
            {renderTab('closed', t('closed'))}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMyJobs} tintColor={theme.primary} />}
      >
        {loading ? (
             <>
               <JobCardSkeleton />
               <JobCardSkeleton />
               <JobCardSkeleton />
             </>
        ) : (
            <>
                {filteredJobs.length === 0 ? (
                    <EmptyState 
                        icon="briefcase-outline"
                        title={t('noJobs')}
                        description={t('createFirstJobDesc') || "Create your first vacancy to start hiring workers."}
                        actionLabel={t('createJob') || "Create Job"}
                        onAction={() => router.push('/(employer)/create-job')}
                    />
                ) : (
                    filteredJobs.map((job, index) => (
                        <TouchableOpacity 
                            key={job.id} 
                            activeOpacity={0.9}
                            onPress={() => router.push(`/(employer)/job-details/${job.id}`)}
                        >
                            <Card 
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

                                    <View style={styles.footerRow}>
                                        <View style={styles.statusChip}>
                                            <Text style={{ color: job.is_active ? 'green' : 'gray', fontWeight: '600' }}>
                                                {job.is_active ? t('active') : t('closed')}
                                            </Text>
                                        </View>
                                        <View style={styles.appCountChip}>
                                            <Ionicons name="people" size={14} color={theme.textSecondary} />
                                            <Text style={{ marginLeft: 4, color: theme.textSecondary, fontWeight: '500' }}>
                                                {job.application_count || 0} {t('candidates') || "Candidates"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.primary }]}
        color="white"
        onPress={() => router.push('/(employer)/create-job')}
      />
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
    paddingBottom: 80, // Space for FAB
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
  footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
  },
  statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
  },
  appCountChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
