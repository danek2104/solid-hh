import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Chip, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { SUGGESTED_SKILLS } from '../../constants/mockData';
import { getLocalizedSkill, getSkillDisplayData, searchSkillAcrossAllLanguages } from '../../constants/dataTranslations';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function SkillsScreen() {
  const router = useRouter();
  const { skills, addSkill, removeSkill, user, login } = useUserStore();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Filter logic: Check ALL languages
  const filteredSkills = SUGGESTED_SKILLS.filter(originalSkill => {
    if (skills.includes(originalSkill)) return false; // Already added
    return searchSkillAcrossAllLanguages(originalSkill, input);
  });

  const handleAdd = (skill: string) => {
    addSkill(skill); // Store original Russian string
    setInput('');
  };

  const handleNext = async () => {
      setSaving(true);
      try {
          // Sync skills with backend if user exists
          if (user?.id) {
              const response = await api.put(`/users/${user.id}`, {
                  skills: skills
              });
              // Update local store with fresh data from backend
              login(response.data);
          }
          router.push('/(onboarding)/jobs');
      } catch (error) {
          console.error("Failed to save skills", error);
          // Proceed anyway for MVP, or alert
          alert("Failed to save skills");
      } finally {
          setSaving(false);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.header}>{t('skillsTitle')}</Text>
        <Text variant="bodyMedium" style={styles.subHeader}>
          {t('skillsSubtitle')}
        </Text>

        <TextInput
          label={t('enterSkill')}
          mode="outlined"
          value={input}
          onChangeText={setInput}
          style={styles.input}
          right={<TextInput.Icon icon="magnify" />}
        />

        {/* Suggestions */}
        {input.length > 0 && (
          <View style={styles.suggestions}>
             {filteredSkills.map((originalSkill) => {
               const { primary, secondary } = getSkillDisplayData(originalSkill, currentLang);
               return (
                 <List.Item
                   key={originalSkill}
                   title={
                       <Text>
                           {primary} <Text style={{color: '#888'}}>({secondary})</Text>
                       </Text>
                   }
                   onPress={() => handleAdd(originalSkill)}
                   left={props => <List.Icon {...props} icon="plus" />}
                 />
               );
             })}
             {filteredSkills.length === 0 && (
               <List.Item title={t('notFound')} />
             )}
          </View>
        )}

        {/* Selected Skills */}
        <View style={styles.chipContainer}>
          {skills.map((originalSkill) => {
             const displaySkill = getLocalizedSkill(originalSkill, currentLang);
             return (
                <Chip 
                  key={originalSkill} 
                  onClose={() => removeSkill(originalSkill)} 
                  style={styles.chip}
                  mode="flat"
                >
                  {displaySkill}
                </Chip>
             );
          })}
        </View>

        <View style={styles.footer}>
          <Button 
            mode="contained" 
            onPress={handleNext} 
            style={styles.button}
            contentStyle={styles.buttonContent}
            disabled={skills.length === 0 || saving}
            loading={saving}
          >
            {t('next')}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeader: {
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  suggestions: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
  button: {
    marginTop: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  }
});