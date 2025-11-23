import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const ClosedShiftCard = memo(({
  title,
  date,
  payout,
  location,
  rating,
  feedback,
}) => (
  <View style={styles.closedCard}>
    <View style={styles.closedHeader}>
      <Text style={styles.closedTitle}>{title}</Text>
      <Text style={styles.closedDate}>{date}</Text>
    </View>
    <Text style={styles.closedMeta}>{location}</Text>
    <Text style={styles.closedPay}>{payout}</Text>
    <View style={styles.closedRating}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons
          key={idx}
          name={idx < rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFCA28"
        />
      ))}
    </View>
    <Text style={styles.closedFeedback}>{feedback}</Text>
  </View>
));

ClosedShiftCard.displayName = 'ClosedShiftCard';

export default ClosedShiftCard;
