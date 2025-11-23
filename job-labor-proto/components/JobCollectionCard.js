import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../AppStyles';

const JobCollectionCard = ({ title, count, shift, rate, compact }) => (
  <View style={[styles.collectionCard, compact && styles.collectionCardCompact]}>
    <View style={styles.collectionHeader}>
      <Text style={styles.collectionTitle}>{title}</Text>
      <View style={styles.collectionBadge}>
        <Text style={styles.collectionBadgeText}>{count} смен</Text>
      </View>
    </View>
    <Text style={styles.collectionShift}>{shift}</Text>
    <Text style={styles.collectionRate}>{rate}</Text>
  </View>
);

export default JobCollectionCard;
