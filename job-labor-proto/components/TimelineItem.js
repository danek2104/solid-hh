import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const TimelineItem = memo(({ title, meta, status, compact }) => (
  <View style={[styles.timelineItem, compact && styles.timelineItemCompact]}>
    <View style={[styles.timelineDot, styles[`timelineDot_${status}`]]} />
    <View style={styles.timelineContent}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineMeta}>{meta}</Text>
    </View>
    {status === 'upcoming' && (
      <TouchableOpacity
        style={[
          styles.timelineAction,
          compact && styles.timelineActionCompact,
        ]}
      >
        <Ionicons name="notifications" size={18} color="#C62828" />
        <Text style={styles.timelineActionText}>Напомнить</Text>
      </TouchableOpacity>
    )}
  </View>
));

TimelineItem.displayName = 'TimelineItem';

export default TimelineItem;
