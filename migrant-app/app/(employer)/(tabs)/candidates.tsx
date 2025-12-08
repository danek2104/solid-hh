import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Linking, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Avatar, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useUserStore } from '@/store/userStore';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import Card from '@/components/Card';
import CustomInput from '@/components/CustomInput';
import EmptyState from '@/components/EmptyState';
import { CandidateCardSkeleton } from '@/components/LoadingSkeletons';

export default function CandidatesScreen() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  
  const { user } = useUserStore();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isFocused = useIsFocused();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.id && isFocused) {
      fetchData();
    }
  }, [user?.id, isFocused]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, jobsRes] = await Promise.all([
          api.get(`/applications/employer/${user?.id}`),
          api.get(`/jobs/employer/${user?.id}`)
      ]);
      setApplications(appsRes.data);
      setJobs(jobsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const filteredApplications = applications.filter(app => {
      const name = `${app.first_name} ${app.last_name}`.toLowerCase();
      const job = app.job_title?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || job.includes(query);
      
      const matchesJob = activeJobId ? app.job_id === activeJobId : true;
      const matchesStatus = activeStatus ? app.status === activeStatus : true;

      return matchesSearch && matchesJob && matchesStatus;
  });

  const STATUSES = [
      { value: 'pending', label: t('status_new') || 'New' },
      { value: 'interview', label: t('status_interview') || 'Interview' },
      { value: 'accepted', label: t('status_hired') || 'Hired' },
      { value: 'rejected', label: t('status_rejected') || 'Rejected' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '800', marginBottom: 16, color: theme.text }}>
            {t('candidates')}
        </Text>
        
        {/* Job Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <Chip 
                selected={activeJobId === null} 
                onPress={() => setActiveJobId(null)}
                style={{ marginRight: 8, backgroundColor: activeJobId === null ? theme.secondary : theme.surface }}
                textStyle={{ color: activeJobId === null ? theme.primary : theme.text }}
                showSelectedOverlay
            >
                {t('allJobs') || "All Jobs"}
            </Chip>
            {jobs.map(job => (
                <Chip
                    key={job.id}
                    selected={activeJobId === job.id}
                    onPress={() => setActiveJobId(job.id)}
                    style={{ marginRight: 8, backgroundColor: activeJobId === job.id ? theme.secondary : theme.surface, borderColor: theme.border, borderWidth: activeJobId === job.id ? 0 : 1 }}
                    textStyle={{ color: activeJobId === job.id ? theme.primary : theme.text }}
                >
                    {job.title}
                </Chip>
            ))}
        </ScrollView>

        {/* Status Filter Chips */}
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <Chip 
                selected={activeStatus === null} 
                onPress={() => setActiveStatus(null)}
                style={{ marginRight: 8, backgroundColor: activeStatus === null ? theme.secondary : theme.surface }}
                textStyle={{ color: activeStatus === null ? theme.primary : theme.text }}
                showSelectedOverlay
            >
                {t('allStatuses') || "All Statuses"}
            </Chip>
            {STATUSES.map(status => (
                <Chip
                    key={status.value}
                    selected={activeStatus === status.value}
                    onPress={() => setActiveStatus(status.value)}
                    style={{ marginRight: 8, backgroundColor: activeStatus === status.value ? theme.secondary : theme.surface, borderColor: theme.border, borderWidth: activeStatus === status.value ? 0 : 1 }}
                    textStyle={{ color: activeStatus === status.value ? theme.primary : theme.text }}
                >
                    {status.label}
                </Chip>
            ))}
        </ScrollView>

        <CustomInput
            placeholder={t('searchCandidatesPlaceholder') || "Search candidates..."}
            onChangeText={setSearchQuery}
            value={searchQuery}
            icon="search"
            style={styles.searchBar}
            containerStyle={{ marginBottom: 0 }}
        />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={theme.primary} />}
      >
        {loading ? (
            <>
                <CandidateCardSkeleton />
                <CandidateCardSkeleton />
                <CandidateCardSkeleton />
            </>
        ) : (
            <>
                {filteredApplications.length === 0 ? (
                    <EmptyState 
                        icon="people-outline"
                        title={t('noCandidates')}
                        description={t('noCandidatesDesc') || "Wait for workers to apply to your jobs."}
                    />
                ) : (
                    filteredApplications.map((item, index) => (
                        <TouchableOpacity 
                            key={item.id} 
                            activeOpacity={0.9}
                            onPress={() => router.push({
                                pathname: `/(employer)/candidate-details/${item.user_id}`,
                                params: { 
                                    applicationId: item.id, 
                                    coverLetter: item.cover_letter,
                                    initialStatus: item.status,
                                    initialNotes: item.notes
                                }
                            })}
                        >
                            <Card
                                entering={FadeInUp.delay(index * 100).springify()}
                                layout={Layout.springify()}
                                style={styles.card}
                            >
                                <View style={styles.row}>
                                <Avatar.Text 
                                    size={56} 
                                    label={(item.first_name?.[0] || 'U') + (item.last_name?.[0] || '')} 
                                    style={{ backgroundColor: theme.primary }} 
                                    color="#FFF"
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', fontSize: 18 }}>
                                        {item.first_name} {item.last_name}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                                        {t('appliedFor')} <Text style={{ fontWeight: '600', color: theme.primary }}>{item.job_title}</Text>
                                    </Text>
                                    <Text style={{ marginTop: 4, fontSize: 12, color: theme.textSecondary }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <IconButton 
                                    icon="phone" 
                                    mode="contained" 
                                    containerColor={theme.secondary} 
                                    iconColor={theme.primary} 
                                    size={24} 
                                    onPress={() => handleCall(item.phone)} 
                                />
                            </View>
                            
                            {item.cover_letter && (
                                <View style={[styles.letterBox, { backgroundColor: theme.background }]}>
                                    <Text style={{ color: theme.text, fontStyle: 'italic', lineHeight: 20 }}>"{item.cover_letter}"</Text>
                                </View>
                            )}
                        </Card>
                    </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  searchBar: {
    marginBottom: 0,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  letterBox: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
  }
});
