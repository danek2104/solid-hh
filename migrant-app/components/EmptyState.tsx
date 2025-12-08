import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import PrimaryButton from './PrimaryButton';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction, style }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Animated.View entering={FadeInUp.delay(200)} style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
        <Ionicons name={icon} size={48} color={theme.primary} />
      </View>
      <Text variant="titleMedium" style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <PrimaryButton 
          title={actionLabel} 
          onPress={onAction} 
          style={styles.button}
          textStyle={{ fontSize: 14 }}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 250,
    lineHeight: 20,
  },
  button: {
    minWidth: 150,
    height: 44,
  },
});
