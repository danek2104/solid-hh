import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../AppStyles';
import ShiftCalendar from './ShiftCalendar';
import WeeklyHoursMatrix from './WeeklyHoursMatrix';
import QuickTemplateButton from './QuickTemplateButton';
import VacationBanner from './VacationBanner';

const AvailabilityPlanner = ({
  calendar,
  matrix,
  onToggleSlot,
  quickTemplates,
  onApplyTemplate,
  activeTemplate,
  vacation,
  onToggleVacation,
  compact,
  onAcceptShift,
  onRejectShift,
  isLoadingShifts,
}) => (
  <View
    style={[styles.availabilityPlanner, compact && styles.availabilityPlannerCompact]}
  >
    <Text style={styles.blockTitle}>Календарь смен</Text>
    {isLoadingShifts ? (
      <View style={styles.shiftCalendarLoading}>
        <ActivityIndicator size="small" color={styles.theme.primary} />
        <Text style={styles.shiftCalendarLoadingText}>Загрузка смен...</Text>
      </View>
    ) : (
      <ShiftCalendar
        days={calendar}
        onAcceptShift={onAcceptShift}
        onRejectShift={onRejectShift}
      />
    )}
    <Text style={styles.blockTitle}>Недельная матрица часов</Text>
    <WeeklyHoursMatrix matrix={matrix} onToggleSlot={onToggleSlot} />
    <Text style={styles.blockTitle}>Быстрые шаблоны</Text>
    <View style={styles.templatesRow}>
      {quickTemplates.map((template) => (
        <QuickTemplateButton
          key={template.key}
          template={template}
          onPress={() => onApplyTemplate(template.key)}
          active={activeTemplate === template.key}
        />
      ))}
    </View>
    <VacationBanner
      active={vacation.active}
      from={vacation.from}
      to={vacation.to}
      onToggle={onToggleVacation}
    />
  </View>
);

export default AvailabilityPlanner;
