import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Chip, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { SUGGESTED_SKILLS } from '../../constants/mockData';
import { getLocalizedSkill, getSkillDisplayData, searchSkillAcrossAllLanguages } from '../../constants/dataTranslations';
import { useTranslation } from 'react-i18next';

export default function SkillsTab() {
  const { skills, addSkill, removeSkill } = useUserStore();
  const [input, setInput] = useState('');
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const filteredSkills = SUGGESTED_SKILLS.filter(originalSkill => {
    if (skills.includes(originalSkill)) return false;
    return searchSkillAcrossAllLanguages(originalSkill, input);
  });

  const handleAdd = (skill: string) => {
    addSkill(skill);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.header}>{t('mySkills')}</Text>
        <Text variant="bodyMedium" style={{marginBottom: 16, color: '#666'}}>
            {t('addSkillInfo')}
        </Text>

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
          {skills.length === 0 && <Text style={{color: '#999'}}>{t('emptySkills')}</Text>}
        </View>

        <Text variant="titleMedium" style={{marginTop: 24, marginBottom: 8}}>{t('addSkill')}</Text>
        <TextInput
          label={t('skillName')}
          mode="outlined"
          value={input}
          onChangeText={setInput}
          style={styles.input}
          right={<TextInput.Icon icon="magnify" />}
        />

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
          </View>
        )}
      </ScrollView>
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
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 50,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  input: {
    marginBottom: 8,
  },
  suggestions: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
