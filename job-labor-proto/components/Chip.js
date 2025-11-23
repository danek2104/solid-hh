import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../AppStyles';

const Chip = ({ label, outline }) => {
  return (
    <View style={[styles.chip, outline && styles.chipOutline]}>
      <Text style={[styles.chipText, outline && styles.chipTextOutline]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: theme.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  chipOutline: {
    backgroundColor: 'transparent',
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextOutline: {
    color: theme.primary,
  },
});

export default Chip;
