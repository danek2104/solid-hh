import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const WorkerCard = memo(({
  name,
  role,
  rating,
  experience,
  rate,
  availability,
  badges,
  skills,
}) => (
  <View style={styles.workerCard}>
    <View style={styles.workerHeader}>
      <View>
        <Text style={styles.workerName}>{name}</Text>
        <Text style={styles.workerRole}>{role}</Text>
      </View>
      <View style={styles.workerRating}>
        <Ionicons name="star" size={16} color="#FFCA28" />
        <Text style={styles.workerRatingText}>{rating}</Text>
      </View>
    </View>
    <Text style={styles.workerMeta}>
      {[experience && experience !== '.' ? experience : null, rate && rate !== '.' ? rate : null].filter(Boolean).join(' · ') || ''}
    </Text>
    <Text style={styles.workerAvailability}>{availability}</Text>
    <View style={styles.badgeRow}>
      {Array.isArray(badges) && badges.map((badge) => (
        <View key={badge} style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badge}</Text>
        </View>
      ))}
    </View>
    <Text style={styles.workerSkills}>
      Навыки: {Array.isArray(skills) ? skills.join(', ') : ''}
    </Text>
    <TouchableOpacity style={styles.workerButton}>
      <Text style={styles.workerButtonText}>Пригласить</Text>
    </TouchableOpacity>
  </View>
));

WorkerCard.displayName = 'WorkerCard';

export default WorkerCard;
