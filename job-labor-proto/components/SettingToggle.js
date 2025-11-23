import React from 'react';
import { View, Text, Switch } from 'react-native';
import { styles } from '../AppStyles';

const SettingToggle = ({
  label,
  subtitle,
  value,
  onToggle,
  compact,
}) => (
  <View style={[styles.settingRow, compact && styles.settingRowCompact]}>
    <View style={styles.settingBody}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      thumbColor={value ? '#fff' : '#f4f4f4'}
      trackColor={{ false: '#E0E0E0', true: '#C62828' }}
    />
  </View>
);

export default SettingToggle;
