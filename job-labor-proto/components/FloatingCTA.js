import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const FloatingCTA = ({ compact, label, icon }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.fab, compact && styles.fabCompact]}
  >
    <LinearGradient
      colors={['#FF7043', '#C62828']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fabInner}
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={styles.fabText}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default FloatingCTA;
