import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/components/useColorScheme';
import { SKILL_TRANSLATIONS, getLocalizedSkill } from '@/constants/dataTranslations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CreateJobScreen() {
  const [form, setForm] = useState({
      title: '',
      location: '',
      salary_min: '',
      salary_max: '',
      description: ''
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendSkills, setBackendSkills] = useState<string[]>([]);
  
  const { user } = useUserStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
      fetchSkills();
  }, []);

  const fetchSkills = async () => {
      try {
          const res = await api.get('/skills');
          // Map to names
          const names = res.data.map((s: any) => s.name);
          setBackendSkills(names);
      } catch (error) {
          console.error("Failed to fetch skills", error);
      }
  };

  // Merge backend skills with translations and hardcoded defaults (if backend is empty/failing or to ensure common ones appear)
  // We prioritize backend skills, but also include the hardcoded ones if they aren't in backend yet (to allow seeding).
  const predefinedSkills = Object.keys(SKILL_TRANSLATIONS);
  
  const commonExtraSkills = [
      "Ответственность", "Аккуратность", "Пунктуальность",
      "Знание города", "Быстрота", "Навигатор", "Водительские права B",
      "Стаж вождения 3+", "Санкнижка", "Выносливость",
      "Без опыта", "Внимательность", "Обучаемость", "Шитье",
      "Опыт 1 год", "Вежливость", "Русский язык", "Трудолюбие", "Без вредных привычек"
  ];

  const uniqueSuggestions = Array.from(new Set([...backendSkills, ...predefinedSkills, ...commonExtraSkills]));

  const handleChange = (key: string, value: string) => {
      // Validate numeric fields
      if (key === 'salary_min' || key === 'salary_max') {
          if (/[^0-9]/.test(value)) return;
      }
      setForm({ ...form, [key]: value });
  };

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

  const handleSubmit = async () => {
      if (!form.title || !form.salary_min || !form.location) {
          Alert.alert(t('error'), t('requiredField'));
          return;
      }

      if (form.description.length < 20) {
          Alert.alert(t('error'), t('descTooShort') || "Description must be at least 20 characters.");
          return;
      }

      setLoading(true);
      try {
          await api.post('/jobs', {
              ...form,
              salary_min: Number(form.salary_min),
              salary_max: Number(form.salary_max),
              employer_id: user?.id,
              skills: selectedSkills 
          });
          Alert.alert(t('success'), "Job created successfully");
          router.back();
      } catch (error) {
          console.error(error);
          Alert.alert(t('error'), "Failed to create job");
      } finally {
          setLoading(false);
      }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.text }]}>{t('createVacancy')}</Text>

        <CustomInput
            label={t('jobTitle') + " *"}
            placeholder={t('jobTitle')}
            value={form.title}
            onChangeText={(t) => handleChange('title', t)}
        />

        <CustomInput
            label={t('location') + " *"}
            placeholder={t('location')}
            value={form.location}
            onChangeText={(t) => handleChange('location', t)}
        />
        
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <CustomInput
                    label={t('minSalary') + " (RUB) *"}
                    placeholder=""
                    keyboardType="numeric"
                    value={form.salary_min}
                    onChangeText={(t) => handleChange('salary_min', t)}
                />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
                <CustomInput
                    label={t('maxSalary') + " (RUB)"}
                    placeholder=""
                    keyboardType="numeric"
                    value={form.salary_max}
                    onChangeText={(t) => handleChange('salary_max', t)}
                />
            </View>
        </View>

        {/* Selected Skills */}
        <Text style={{ marginBottom: 12, fontWeight: '600', color: theme.text }}>{t('selectedSkills')}</Text>
        <View style={styles.skillsContainer}>
            {selectedSkills.length === 0 && <Text style={{color: theme.textSecondary, marginBottom: 8}}>{t('noSkillsSelected')}</Text>}
            {selectedSkills.map((skill) => (
                <Chip 
                    key={skill} 
                    onClose={() => toggleSkill(skill)}
                    style={{ marginBottom: 8, marginRight: 8, backgroundColor: theme.secondary }}
                    textStyle={{ color: theme.primary }}
                >
                    {getLocalizedSkill(skill, i18n.language)}
                </Chip>
            ))}
        </View>

        {/* Add Custom Skill */}
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
                    marginBottom: 16 // Align with input bottom
                }}
             >
                 <MaterialCommunityIcons name="plus" size={28} color="white" />
             </TouchableOpacity>
        </View>

        {/* Suggestions */}
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

        <CustomInput
            label={t('description')}
            placeholder=""
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(t) => handleChange('description', t)}
            style={{ height: 100, textAlignVertical: 'top' }} 
        />

        <PrimaryButton 
            title={t('postJob')} 
            onPress={handleSubmit} 
            loading={loading}
            style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  row: {
      flexDirection: 'row',
  },
  skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
  }
});
