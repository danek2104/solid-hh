import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import SkillRow from './SkillRow';

const SkillEditor = ({ categories, onLevelChange, onToggleGrow, onAddSkill, onDeleteSkill }) => {
  return (
    <View style={styles.skillEditor}>
      {categories.map((category) => {
        const catKey = category.id || category.key;
        return (
        <View key={catKey} style={styles.skillCategoryCard}>
          <View style={styles.skillCategoryHeader}>
            <View>
              <Text style={styles.skillCategoryTitle}>{category.title}</Text>
              <Text style={styles.skillCategoryMeta}>{category.meta}</Text>
            </View>
            <View style={styles.skillCategoryBadge}>
              <Ionicons name="sparkles" size={14} color={theme.primary} />
              <Text style={styles.skillCategoryBadgeText}>
                {category.skills.length} навыка
              </Text>
            </View>
          </View>
          {category.skills.map((skill) => (
            <SkillRow
              key={`${catKey}-${skill.key || skill.id}`}
              categoryKey={catKey}
              skill={skill}
              onLevelChange={onLevelChange}
              onToggleGrow={onToggleGrow}
              onDelete={onDeleteSkill}
            />
          ))}
          <TouchableOpacity
            style={styles.addSkillButton}
            onPress={onAddSkill}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.addSkillButtonText}>Добавить навык</Text>
          </TouchableOpacity>
        </View>
      )})}
    </View>
  );
};

export default SkillEditor;
