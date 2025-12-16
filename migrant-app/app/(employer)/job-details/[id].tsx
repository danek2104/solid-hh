import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Switch, Badge, Chip, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { JobDetailsSkeleton } from '@/components/LoadingSkeletons';
import { getLocalizedSkill, SKILL_TRANSLATIONS } from '@/constants/dataTranslations';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Skills State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [backendSkills, setBackendSkills] = useState<string[]>([]);

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
    fetchSkills();
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
      // Parse skills safely
      if (res.data.skills && Array.isArray(res.data.skills)) {
          setSelectedSkills(res.data.skills);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), t('failedToLoadJob'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
      try {
          const res = await api.get('/skills');
          const names = res.data.map((s: any) => s.name);
          setBackendSkills(names);
      } catch (error) {
          console.error("Failed to fetch skills", error);
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
        skills: selectedSkills
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

  // Skill Helpers
  const toggleSkill = (skill: string) => {
      if (selectedSkills.includes(skill)) {
          setSelectedSkills(selectedSkills.filter(s => s !== skill));
      } else {
          setSelectedSkills([...selectedSkills, skill]);
      }
  };

  const addCustomSkill = () => {
      if (customSkill.trim()) {
          const newSkill = customSkill.trim();
          if (!selectedSkills.includes(newSkill)) {
              setSelectedSkills([...selectedSkills, newSkill]);
          }
          setCustomSkill('');
      }
  };

  const predefinedSkills = Object.keys(SKILL_TRANSLATIONS);
  const commonExtraSkills = [
      "Ответственность", "Аккуратность", "Пунктуальность",
      "Знание города", "Быстрота", "Навигатор", "Водительские права B",
      "Стаж вождения 3+", "Санкнижка", "Выносливость",
      "Без опыта", "Внимательность", "Обучаемость", "Шитье",
      "Опыт 1 год", "Вежливость", "Русский язык", "Трудолюбие", "Без вредных привычек"
  ];
  const uniqueSuggestions = Array.from(new Set([...backendSkills, ...predefinedSkills, ...commonExtraSkills]));


  const navigateToCandidates = () => {
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
                            {t('applications')}
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
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <CustomInput
                            label={t('minSalary')}
                            value={isEditing ? formData.salary_min : String(job.salary_min)}
                            onChangeText={(text) => {
                                if (/^\d*$/.test(text)) setFormData({ ...formData, salary_min: text })
                            }}
                            editable={isEditing}
                            keyboardType="numeric"
                            style={isEditing ? styles.input : styles.readOnlyInput}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <CustomInput
                            label={t('maxSalary')}
                            value={isEditing ? formData.salary_max : String(job.salary_max)}
                            onChangeText={(text) => {
                                if (/^\d*$/.test(text)) setFormData({ ...formData, salary_max: text })
                            }}
                            editable={isEditing}
                            keyboardType="numeric"
                            style={isEditing ? styles.input : styles.readOnlyInput}
                        />
                    </View>
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

        {/* Skills Section */}
        <Animated.View entering={FadeInDown.delay(250)}>
            <Card style={styles.card}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.text }}>
                    {t('skills')}
                </Text>
                
                {/* Selected Skills List */}
                <View style={styles.skillsContainer}>
                    {selectedSkills.length === 0 && (
                        <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>
                            {t('noSkills')}
                        </Text>
                    )}
                    {selectedSkills.map((skill) => (
                        <Chip 
                            key={skill} 
                            onClose={isEditing ? () => toggleSkill(skill) : undefined}
                            style={{ marginBottom: 8, marginRight: 8, backgroundColor: isEditing ? theme.secondary : theme.surface, borderWidth: isEditing ? 0 : 1, borderColor: theme.border }}
                            textStyle={{ color: isEditing ? theme.primary : theme.text }}
                        >
                            {getLocalizedSkill(skill, i18n.language)}
                        </Chip>
                    ))}
                </View>

                {/* Edit Mode: Add Custom & Suggestions */}
                {isEditing && (
                    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                             <View style={{ flex: 1 }}>
                                <CustomInput
                                    label={t('addCustomSkill')}
                                    value={customSkill}
                                    onChangeText={setCustomSkill}
                                    placeholder={t('skillPlaceholder')}
                                    style={{marginBottom: 0}}
                                />
                             </View>
                             <TouchableOpacity 
                                onPress={addCustomSkill} 
                                style={{ 
                                    backgroundColor: theme.primary, 
                                    height: 56, 
                                    width: 56, 
                                    borderRadius: 16, 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    marginBottom: 16 
                                }}
                             >
                                 <MaterialCommunityIcons name="plus" size={28} color="white" />
                             </TouchableOpacity>
                        </View>

                        <Text style={{ marginBottom: 12, fontWeight: '600', color: theme.text }}>{t('suggestedSkills')}</Text>
                        <View style={styles.skillsContainer}>
                            {uniqueSuggestions.filter(s => !selectedSkills.includes(s)).map((skill) => (
                                <Chip 
                                    key={skill} 
                                    onPress={() => toggleSkill(skill)}
                                    style={{ marginBottom: 8, marginRight: 8, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                                    textStyle={{ color: theme.text }}
                                >
                                    {getLocalizedSkill(skill, i18n.language)}
                                </Chip>
                            ))}
                        </View>
                    </View>
                )}
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
  skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
  }
});