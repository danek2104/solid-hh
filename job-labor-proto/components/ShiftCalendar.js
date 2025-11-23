import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';

const ShiftCalendar = ({ days, onAcceptShift, onRejectShift }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.shiftCalendarRow}
  >
    {days.map((day) => {
      const hasAvailableShift = day.shifts && day.shifts.some(s =>
        s.status === 'available' || s.status === 'pending'
      );
      const hasAcceptedShift = day.shifts && day.shifts.some(s =>
        s.status === 'accepted' || s.status === 'confirmed'
      );
      const availableShift = day.shifts?.find(s =>
        s.status === 'available' || s.status === 'pending'
      );

      return (
        <TouchableOpacity
          key={day.key}
          style={[
            styles.shiftCalendarItem,
            styles[`shiftCalendarItem_${day.status}`],
          ]}
          onPress={() => {
            if (hasAvailableShift && availableShift && onAcceptShift) {
              Alert.alert(
                'Принять смену?',
                `Принять смену "${day.title}" на ${day.dateLabel}?`,
                [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Принять',
                    onPress: () => onAcceptShift(availableShift.id),
                    style: 'default'
                  },
                ]
              );
            } else if (hasAcceptedShift && onRejectShift) {
              const acceptedShift = day.shifts.find(s =>
                s.status === 'accepted' || s.status === 'confirmed'
              );
              if (acceptedShift) {
                Alert.alert(
                  'Отклонить смену?',
                  `Отклонить смену "${day.title}" на ${day.dateLabel}?`,
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Отклонить',
                      onPress: () => onRejectShift(acceptedShift.id),
                      style: 'destructive'
                    },
                  ]
                );
              }
            }
          }}
          disabled={!hasAvailableShift && !hasAcceptedShift}
        >
          <Text style={styles.shiftCalendarDay}>{day.dayLabel}</Text>
          <Text style={styles.shiftCalendarDate}>{day.dateLabel}</Text>
          <Text style={styles.shiftCalendarTitle}>{day.title}</Text>
          <Text style={styles.shiftCalendarHours}>{day.hours}</Text>
          {hasAvailableShift && (
            <View style={styles.shiftCalendarActionBadge}>
              <Ionicons name="add-circle" size={16} color={theme.primary} />
              <Text style={styles.shiftCalendarActionText}>Нажмите для принятия</Text>
            </View>
          )}
          {hasAcceptedShift && (
            <View style={styles.shiftCalendarActionBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
              <Text style={styles.shiftCalendarActionText}>Нажмите для отмены</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

export default ShiftCalendar;
