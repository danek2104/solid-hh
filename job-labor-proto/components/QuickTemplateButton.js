import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../AppStyles';

const QuickTemplateButton = ({ template, active, onPress }) => (
  <TouchableOpacity
    style={[styles.templateButton, active && styles.templateButtonActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
  >
    <Text style={styles.templateButtonLabel}>{template.label}</Text>
    <Text style={styles.templateButtonHint}>{template.description}</Text>
  </TouchableOpacity>
);

export default QuickTemplateButton;
