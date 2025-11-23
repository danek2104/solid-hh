import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const WeeklyHoursMatrix = ({ matrix, onToggleSlot }) => (
  <View style={styles.weekMatrixWrapper}>
    <View style={styles.weekMatrixHeader}>
      <View style={styles.weekMatrixCornerCell}>
        <Text style={styles.weekMatrixLegend}>Слоты</Text>
      </View>
      {weekDays.map((day) => (
        <View key={day} style={styles.weekMatrixHeaderCell}>
          <Text style={styles.weekMatrixHeaderText}>{day}</Text>
        </View>
      ))}
    </View>
    {matrix.map((row) => (
      <View key={row.key} style={styles.weekMatrixRow}>
        <View style={styles.weekMatrixLabelCell}>
          <Text style={styles.weekMatrixLabel}>{row.label}</Text>
          <Text style={styles.weekMatrixHours}>{row.hours}</Text>
        </View>
        {weekDays.map((day) => {
          const active = row.days[day];
          return (
            <TouchableOpacity
              key={`${row.key}-${day}`}
              style={[
                styles.weekMatrixCell,
                active && styles.weekMatrixCellActive,
              ]}
              onPress={() => onToggleSlot(row.key, day)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              {active && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>
    ))}
  </View>
);

export default WeeklyHoursMatrix;
