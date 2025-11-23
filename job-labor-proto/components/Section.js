import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../AppStyles';

const Section = ({ title, children, compact }) => (
  <View style={[styles.section, compact && styles.sectionCompact]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default Section;
