import React, { memo } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from '../AppStyles';

const Chip = memo(({ label, onPress, variant = 'solid' }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.chip,
      variant === 'outline' && styles.chipOutline,
    ]}
  >
    <Text
      style={[
        styles.chipText,
        variant === 'outline' && styles.chipTextOutline,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
));

Chip.displayName = 'Chip';

export default Chip;
