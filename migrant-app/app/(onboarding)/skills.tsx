import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Chip, List, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { SUGGESTED_SKILLS } from '../../constants/mockData';
import { getLocalizedSkill, getSkillDisplayData, searchSkillAcrossAllLanguages } from '../../constants/dataTranslations';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useColorScheme } from '@/components/useColorScheme';

export default function SkillsScreen() {
  const router = useRouter();
  const { skills, addSkill, removeSkill, user, login, completeOnboarding } = useUserStore();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const isEmployer = user?.role === 'employer';

  const filteredSkills = SUGGESTED_SKILLS.filter(originalSkill => {
    if (skills.includes(originalSkill)) return false;
    return searchSkillAcrossAllLanguages(originalSkill, input);
  });

  const handleAdd = (skill: string) => {
    addSkill(skill);
    setInput('');
  };

  const handleNext = async () => {
      setSaving(true);
      try {
          if (user?.id) {
              const response = await api.put(`/users/${user.id}`, {
                  skills: skills
              });
              login(response.data);
          }
          
          if (isEmployer) {
              // Employer flow: Skills -> Success (Skip jobs/docs)
              router.push('/(onboarding)/success');
          } else {
              // Seeker flow: Skills -> Jobs -> Docs
              router.push('/(onboarding)/jobs');
          }
      } catch (error) {
          console.error("Failed to save skills", error);
          alert("Failed to save skills");
      } finally {
          setSaving(false);
      }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ProgressBar progress={isEmployer ? 0.95 : 0.5} color={theme.primary} style={styles.progress} />
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)}>
            <Text variant="headlineSmall" style={[styles.header, { color: theme.text }]}>
                {isEmployer ? t('roleEmployerTitle') : t('skillsTitle')}
            </Text>
            <Text variant="bodyMedium" style={[styles.subHeader, { color: theme.textSecondary }]}>
                {isEmployer ? t('skillsSubtitle') : t('skillsSubtitle')} 
            </Text>

            <CustomInput
                label={t('enterSkill')}
                value={input}
                onChangeText={setInput}
                style={styles.input}
                inputStyle={{ fontSize: 14 }}
                icon="search"
            />
        </Animated.View>

        <Animated.ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {input.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100)} style={[styles.suggestions, { backgroundColor: theme.surface }]}>
                {filteredSkills.map((originalSkill) => {
                const { primary, secondary } = getSkillDisplayData(originalSkill, currentLang);
                return (
                    <List.Item
                    key={originalSkill}
                    title={
                        <Text style={{ color: theme.text, fontSize: 13 }}>
                            {primary} <Text style={{color: theme.textSecondary, fontSize: 11 }}>({secondary})</Text>
                        </Text>
                    }
                    onPress={() => handleAdd(originalSkill)}
                    left={props => <List.Icon {...props} icon="plus" color={theme.primary} />}
                    style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}
                    />
                );
                })}
                {filteredSkills.length === 0 && (
                <List.Item title={t('notFound')} titleStyle={{ color: theme.textSecondary, fontSize: 13 }} />
                )}
            </Animated.View>
            )}

            <View style={styles.chipContainer}>
                {skills.map((originalSkill) => {
                    const { primary, secondary } = getSkillDisplayData(originalSkill, currentLang);
                    return (
                        <Animated.View key={originalSkill} layout={Layout.springify()}>
                            <View 
                                style={[
                                    styles.customChip, 
                                    { backgroundColor: theme.secondary }
                                ]}
                            >
                                <View style={styles.chipTextContainer}>
                                    <Text style={[styles.chipPrimary, { color: theme.primary }]}>{primary}</Text>
                                    {secondary && <Text style={[styles.chipSecondary, { color: theme.primary }]}>{secondary}</Text>}
                                </View>
                                <TouchableOpacity onPress={() => removeSkill(originalSkill)} hitSlop={8}>
                                    <Ionicons name="close-circle" size={20} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    );
                })}
            </View>
        </Animated.ScrollView>

        <View style={styles.footer}>
          <PrimaryButton 
            title={t('next')} 
            onPress={handleNext} 
            disabled={skills.length === 0 || saving}
            loading={saving}
          />
        </View>
      </View>
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
  content: {
    padding: 24,
    flex: 1,
  },
  header: {
    fontWeight: '800',
    marginBottom: 8,
  },
  subHeader: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  scrollArea: {
      flex: 1,
  },
  suggestions: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  customChip: {
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4,
    maxWidth: '100%', 
  },
  chipTextContainer: {
      flexShrink: 1,
      marginRight: 6,
  },
  chipPrimary: {
      fontWeight: '700',
      fontSize: 12,
  },
  chipSecondary: {
      fontSize: 10,
      opacity: 0.8,
  },
  chip: {
    borderRadius: 20,
  },
  footer: {
    marginTop: 16,
  },
});