import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';
import { theme } from '../AppStyles';

const VacationBanner = ({ active, from, to, onToggle }) => (
  <TouchableOpacity
    style={[styles.vacationBanner, active && styles.vacationBannerActive]}
    onPress={onToggle}
    accessibilityRole="button"
    accessibilityState={{ pressed: active }}
  >
    <View style={styles.vacationBannerBody}>
      <Ionicons name="airplane" size={18} color={theme.primary} />
      <View>
        <Text style={styles.vacationBannerTitle}>
          {active ? 'В отпуске' : 'Запланировать отпуск'}
        </Text>
        <Text style={styles.vacationBannerDates}>
          {(from && from !== '.' ? from : '')} — {(to && to !== '.' ? to : '')}
        </Text>
      </View>
    </View>
    <Text style={styles.vacationBannerAction}>
      {active ? 'Отменить' : 'Зафиксировать'}
    </Text>
  </TouchableOpacity>
);

export default VacationBanner;