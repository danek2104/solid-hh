import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';

const skillLevelLabels = {
  1: 'Новичок',
  2: 'Стажёр',
  3: 'Уверенно',
  4: 'Эксперт',
  5: 'Наставник',
};

const SkillRow = ({ categoryKey, skill, onLevelChange, onToggleGrow, onDelete }) => {
  return (
    <View style={styles.skillRow} pointerEvents="box-none">
      <View style={styles.skillRowHeader} pointerEvents="box-none">
        <Text style={styles.skillName}>{skill.label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} pointerEvents="box-none">
          <View style={styles.skillRatingBadge} pointerEvents="none">
            <Ionicons name="star" size={14} color="#FFB300" />
            <Text style={styles.skillRatingValue}>{skill.level}/5</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (onDelete && typeof onDelete === 'function') {
                try {
                  onDelete(categoryKey, skill.key);
                } catch (error) {
                  Alert.alert('Ошибка', `Ошибка при удалении: ${error.message}`);
                }
              }
            }}
            style={styles.skillDeleteButton}
            activeOpacity={0.5}
            accessibilityLabel="Удалить навык"
            accessibilityRole="button"
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="trash-outline" size={22} color="#C62828" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.skillTagsRow}>
        {skill.tags.map((tag) => (
          <View key={tag} style={styles.skillTag}>
            <Text style={styles.skillTagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <Slider
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={skill.level}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor="#FFE0E0"
        thumbTintColor={theme.primary}
        onValueChange={(value) => onLevelChange(categoryKey, skill.key, value)}
        style={styles.skillSlider}
      />
      <Text style={styles.skillLevelHint}>{skillLevelLabels[skill.level]}</Text>
      {skill.usages?.length > 0 && (
        <View style={styles.skillUsageRow}>
          {skill.usages.map((usage) => (
            <View key={usage} style={styles.skillUsagePill}>
              <Text style={styles.skillUsageText}>{usage}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.skillGrowButton,
          skill.wantToGrow && styles.skillGrowButtonActive,
        ]}
        onPress={() => onToggleGrow(categoryKey, skill.key)}
        accessibilityRole="button"
        accessibilityState={{ selected: skill.wantToGrow }}
      >
        <Ionicons
          name={skill.wantToGrow ? 'trending-up' : 'add-circle-outline'}
          size={16}
          color={theme.primary}
        />
        <Text style={styles.skillGrowButtonText}>
          {skill.wantToGrow ? 'Отмечен для работы' : 'Хочу работать'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SkillRow;
