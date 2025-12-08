import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { CandidateProfileSkeleton } from '@/components/LoadingSkeletons';

const { width } = Dimensions.get('window');

export default function CandidateProfileScreen() {
  const { id, applicationId, coverLetter, initialStatus, initialNotes } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(initialStatus as string || 'pending');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState(initialNotes as string || '');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setCandidate(res.data);
    } catch (error) {
      console.error(error);
      alert(t('failedToLoadCandidate'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
      setStatus(newStatus); // Optimistic update
      if (!applicationId) return;
      
      setUpdatingStatus(true);
      try {
          await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      } catch (error) {
          console.error(error);
          alert("Failed to update status");
          setStatus(status); // Revert
      } finally {
          setUpdatingStatus(false);
      }
  };

  const handleSaveNotes = async () => {
      if (!applicationId) return;
      
      setSavingNotes(true);
      try {
          await api.put(`/applications/${applicationId}/notes`, { notes });
          Alert.alert(t('success'), t('notesSaved') || "Notes saved");
      } catch (error) {
          console.error(error);
          Alert.alert(t('error'), "Failed to save notes");
      } finally {
          setSavingNotes(false);
      }
  };

  const handleCall = () => {
    if (candidate?.phone) {
        Linking.openURL(`tel:${candidate.phone}`);
    }
  };

  const openWhatsApp = () => {
      if (!candidate?.phone) return;
      const cleanPhone = candidate.phone.replace(/[^\d]/g, ''); 
      Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const openTelegram = () => {
      if (!candidate?.phone) return;
      const cleanPhone = candidate.phone.replace(/[^\d]/g, '');
      Linking.openURL(`https://t.me/+${cleanPhone}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <CandidateProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Navbar (Back Button) - Now sticky at top */}
      <SafeAreaView style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
               <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('candidateProfile')}</Text>
          <View style={{ width: 40 }} /> 
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.heroSection}>
            <View style={styles.avatarWrapper}>
                <Avatar.Text 
                    size={80} 
                    label={(candidate.first_name?.[0] || 'U') + (candidate.last_name?.[0] || '')} 
                    style={{ backgroundColor: theme.primary }}
                    labelStyle={{ color: '#FFF', fontSize: 28, fontWeight: 'bold' }} 
                />
                <View style={[styles.verifiedBadge, { backgroundColor: theme.surface, borderColor: theme.surface }]}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                </View>
            </View>

            <View style={{ flex: 1 }}>
                <Text style={[styles.nameText, { color: theme.text }]}>
                    {candidate.first_name} {candidate.last_name}
                </Text>
                <Text style={[styles.roleText, { color: theme.textSecondary }]}>
                    {candidate.job_title || t('candidateProfile')}
                </Text>

                <View style={styles.infoRow}>
                    <Ionicons name="flag-outline" size={14} color={theme.textSecondary} />
                    <Text style={{ marginLeft: 4, marginRight: 12, color: theme.textSecondary, fontSize: 13 }}>
                        {candidate.citizenship || t('citizenshipNotSet')}
                    </Text>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <Text style={{ marginLeft: 4, color: theme.textSecondary, fontSize: 13 }}>
                        {candidate.city || t('locationNotSet') || "Moscow"}
                    </Text>
                </View>
            </View>
        </Animated.View>

        <View style={styles.separator} />

        {/* Status CRM */}
        {applicationId && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.sectionContainer}>
                <Text style={[styles.sectionHeader, { color: theme.text }]}>{t('applicationStatus')}</Text>
                <View style={styles.statusGrid}>
                    {[
                        { value: 'pending', label: t('status_new'), color: '#2196F3', icon: 'flash' },
                        { value: 'interview', label: t('status_interview'), color: '#FF9800', icon: 'people' },
                        { value: 'accepted', label: t('status_hired'), color: '#4CAF50', icon: 'briefcase' },
                        { value: 'rejected', label: t('status_rejected'), color: '#F44336', icon: 'close-circle' }
                    ].map((opt) => {
                        const isSelected = status === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => handleStatusChange(opt.value)}
                                activeOpacity={0.9}
                                style={[
                                    styles.statusButton,
                                    { 
                                        backgroundColor: isSelected ? opt.color : theme.surface,
                                        borderColor: isSelected ? opt.color : theme.border,
                                        borderWidth: isSelected ? 0 : 1,
                                    }
                                ]}
                            >
                                <Ionicons 
                                    name={opt.icon as any} 
                                    size={20} 
                                    color={isSelected ? '#FFF' : theme.textSecondary} 
                                    style={{ marginBottom: 4 }}
                                />
                                <Text style={{ 
                                    fontWeight: '600', 
                                    fontSize: 12,
                                    color: isSelected ? '#FFF' : theme.textSecondary,
                                }}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>
        )}

        {/* Notes */}
        {applicationId && (
            <Animated.View entering={FadeInDown.delay(300)} style={[styles.sectionContainer, { marginTop: 70 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionHeader, { color: theme.text, marginBottom: 0 }]}>{t('notes')}</Text>
                    <TouchableOpacity onPress={handleSaveNotes} disabled={savingNotes}>
                        {savingNotes ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('save')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={[styles.notesContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <CustomInput
                        placeholder={t('addNotePlaceholder')}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top', backgroundColor: 'transparent', borderWidth: 0 }}
                        containerStyle={{ marginBottom: 0 }}
                    />
                </View>
            </Animated.View>
        )}

        {/* Skills & Langs */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>{t('skills')}</Text>
            <View style={styles.chipWrapper}>
                {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((skill: string, idx: number) => (
                        <View key={idx} style={[styles.skillChip, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                            <Text style={{ color: theme.text, fontWeight: '500' }}>{skill}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: theme.textSecondary }}>{t('noSkills')}</Text>
                )}
            </View>
        </Animated.View>

        {/* Documents */}
        <Animated.View entering={FadeInDown.delay(500)} style={[styles.sectionContainer, { marginBottom: 100 }]}>
             <Text style={[styles.sectionHeader, { color: theme.text }]}>{t('documents')}</Text>
             <View style={[styles.docList, { backgroundColor: theme.surface }]}>
                {[
                    { label: t('passport'), valid: !!candidate.passport_number },
                    { label: t('migrationCard'), valid: !!candidate.has_migration_card },
                    { label: t('patent'), valid: !!candidate.has_patent, warn: !candidate.has_patent }
                ].map((doc, idx) => (
                    <View key={idx} style={[styles.docItem, idx !== 2 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.docIcon, { backgroundColor: doc.valid ? '#E8F5E9' : (doc.warn ? '#FFF3E0' : '#FFEBEE') }]}>
                                <Ionicons 
                                    name={doc.valid ? "checkmark" : (doc.warn ? "alert" : "close")} 
                                    size={16} 
                                    color={doc.valid ? "green" : (doc.warn ? "orange" : "red")} 
                                />
                            </View>
                            <Text style={{ marginLeft: 12, fontSize: 16, color: theme.text }}>{doc.label}</Text>
                        </View>
                        {doc.valid && <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />}
                    </View>
                ))}
             </View>
        </Animated.View>

      </ScrollView>

      {/* Sticky Footer Action Bar */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
             <PrimaryButton 
                title={t('call')}
                icon="call"
                onPress={handleCall}
                style={{ flex: 2 }}
             />
             <TouchableOpacity onPress={openWhatsApp} style={[styles.socialBtn, { backgroundColor: '#DCF8C6' }]}>
                 <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
             </TouchableOpacity>
             <TouchableOpacity onPress={openTelegram} style={[styles.socialBtn, { backgroundColor: '#E1F5FE' }]}>
                 <Ionicons name="paper-plane" size={24} color="#039BE5" />
             </TouchableOpacity>
          </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      zIndex: 10,
  },
  backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  content: {
      paddingHorizontal: 20,
      paddingTop: 16,
  },
  heroSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
  },
  avatarWrapper: {
      marginRight: 16,
      position: 'relative',
  },
  verifiedBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
  },
  nameText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  roleText: {
      fontSize: 15,
      marginBottom: 8,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  separator: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginBottom: 24,
  },
  sectionContainer: {
      marginBottom: 32, // Increased spacing to prevent overlap
  },
  sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
  },
  statusGrid: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
  },
  statusButton: {
      flex: 1,
      minWidth: '45%',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
  },
  notesContainer: {
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
  },
  chipWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
  },
  skillChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
  },
  docList: {
      borderRadius: 16,
      padding: 8,
  },
  docItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 8,
  },
  docIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      borderTopWidth: 1,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
  },
  socialBtn: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
  },
});