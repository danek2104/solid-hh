import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import Tag from './Tag';

const JobCardItem = memo(({ item, isCompact, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.id || item._id);
  }, [item.id, item._id, onPress]);

  return (
    <TouchableOpacity
      style={[styles.jobCard, isCompact && styles.jobCardCompact]}
      onPress={handlePress}
    >
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobCompany}>{item.company || item.employer?.name || 'Компания'}</Text>
      {item.salary && (
        <Text style={styles.jobSalary}>
          {typeof item.salary === 'object'
            ? (item.salary.min || item.salary.max
              ? `${item.salary.min || ''} - ${item.salary.max || ''} ${item.salary.currency || 'сум'}`
              : `${item.salary.currency || 'сум'}`)
            : item.salary}
        </Text>
      )}
      {item.location && (
        <View style={styles.jobLocation}>
          <Ionicons name="location-outline" size={16} color={theme.muted} />
          <Text style={styles.jobLocationText}>{item.location}</Text>
        </View>
      )}
      {item.skills && item.skills.length > 0 && (
        <View style={styles.tagsRow}>
          {item.skills.slice(0, 3).map((skill, index) => (
            <Tag key={index} label={typeof skill === 'string' ? (skill && skill !== '.' ? skill : '') : (skill.name && skill.name !== '.' ? skill.name : '')} />
          ))}
        </View>
      )}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map((tag, index) => (
            <Tag key={index} label={tag} />
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.applyButton}
        onPress={handlePress}
      >
        <Text style={styles.applyButtonText}>Откликнуться</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

JobCardItem.displayName = 'JobCardItem';

export default JobCardItem;
