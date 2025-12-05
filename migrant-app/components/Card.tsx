import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined';
}

const Card = ({ children, style, variant = 'elevated', ...props }: CardProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Animated.View 
      style={[
        styles.card,
        { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: variant === 'outlined' ? 1 : 0,
          shadowColor: theme.text,
        },
        variant === 'elevated' && styles.elevated,
        style
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  elevated: {
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default Card;
