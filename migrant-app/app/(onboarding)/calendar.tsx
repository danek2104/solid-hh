import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const { t, i18n } = useTranslation();

  // Mock next 7 days
  const dates = Array.from({length: 6}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return {
          day: d.getDate(),
          month: d.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' }), // Simple fallback for date locale
          weekday: d.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }),
          full: d.toDateString()
      };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.header}>{t('calendarTitle')}</Text>
        <Text variant="bodyMedium" style={styles.subHeader}>
          {t('calendarSubtitle')}
        </Text>

        <View style={styles.grid}>
            {dates.map((d, i) => (
                <TouchableOpacity 
                    key={i} 
                    style={[styles.dateCard, selectedDate === i && styles.selectedDate]}
                    onPress={() => setSelectedDate(i)}
                >
                    <Text style={[styles.weekday, selectedDate === i && styles.selectedText]}>{d.weekday}</Text>
                    <Text variant="headlineMedium" style={[styles.day, selectedDate === i && styles.selectedText]}>{d.day}</Text>
                    <Text style={[styles.month, selectedDate === i && styles.selectedText]}>{d.month}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View style={styles.footer}>
            <Button 
            mode="contained" 
            onPress={() => router.push('/(onboarding)/success')} 
            style={styles.button}
            contentStyle={styles.buttonContent}
            disabled={selectedDate === null}
            >
            {t('book')}
            </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeader: {
    color: '#666',
    marginBottom: 32,
  },
  grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
  },
  dateCard: {
      width: '30%',
      aspectRatio: 0.8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ddd',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
  },
  selectedDate: {
      backgroundColor: '#0066CC',
      borderColor: '#0066CC',
  },
  weekday: {
      fontSize: 12,
      textTransform: 'uppercase',
      color: '#666',
      marginBottom: 4,
  },
  day: {
      fontWeight: 'bold',
  },
  month: {
      color: '#666',
  },
  selectedText: {
      color: '#fff',
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
  },
  buttonContent: {
    paddingVertical: 8,
  }
});
