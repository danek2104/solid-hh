import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Chip, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { SUGGESTED_SKILLS } from '../../constants/mockData';
import { getLocalizedSkill, getSkillDisplayData, searchSkillAcrossAllLanguages } from '../../constants/dataTranslations';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';

export default function SkillsTab() {
  const { skills, addSkill, removeSkill } = useUserStore();
  const [input, setInput] = useState('');
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const filteredSkills = SUGGESTED_SKILLS.filter(originalSkill => {
    if (skills.includes(originalSkill)) return false;
    return searchSkillAcrossAllLanguages(originalSkill, input);
  });

  const handleAdd = (skill: string) => {
    addSkill(skill);
    setInput('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(200)}>
            <Text variant="headlineSmall" style={[styles.header, { color: theme.text }]}>{t('mySkills')}</Text>
            <Text variant="bodyMedium" style={{marginBottom: 24, color: theme.textSecondary}}>
                {t('addSkillInfo')}
            </Text>
        </Animated.View>

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
          {skills.length === 0 && (
              <Text style={{color: theme.textSecondary, fontStyle: 'italic', marginTop: 8}}>{t('emptySkills')}</Text>
          )}
        </View>

        <Card 
            entering={FadeInDown.delay(300)} 
            style={styles.addCard}
        >
            <Text variant="titleMedium" style={{marginBottom: 16, fontWeight: 'bold', color: theme.text}}>{t('addSkill')}</Text>
            <CustomInput
                label={t('skillName')}
                value={input}
                onChangeText={setInput}
                style={styles.input}
                inputStyle={{ fontSize: 14 }}
                icon="search"
                placeholder={t('enterSkill')}
            />

            {input.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.suggestions, { backgroundColor: theme.background }]}>
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
                    <View style={{ padding: 16 }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{t('notFound')}</Text>
                    </View>
                )}
            </Animated.View>
            )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    fontWeight: '800',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 50,
    gap: 8,
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
  addCard: {
      marginTop: 8,
  },
  input: {
    marginBottom: 8,
  },
  suggestions: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
