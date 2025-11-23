import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { styles } from '../AppStyles';

const Tag = memo(({ label }) => {
  if (!label || label === '') {
    return null;
  }
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
});

Tag.displayName = 'Tag';

export default Tag;
