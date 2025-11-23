import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const ShortcutCard = ({ title, subtitle, icon }) => (
  <View style={styles.shortcutCard}>
    <Ionicons name={icon} size={20} color="#C62828" />
    <Text style={styles.shortcutTitle}>{title}</Text>
    <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
  </View>
);

export default ShortcutCard;
