import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const ReviewCard = memo(({ employer, shift, rating, text, date }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <Text style={styles.reviewEmployer}>{employer}</Text>
      <Text style={styles.reviewDate}>{date}</Text>
    </View>
    <Text style={styles.reviewShift}>{shift}</Text>
    <View style={styles.reviewRating}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons
          key={idx}
          name={idx < rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFCA28"
        />
      ))}
    </View>
    <Text style={styles.reviewText}>{text}</Text>
  </View>
));

ReviewCard.displayName = 'ReviewCard';

export default ReviewCard;
