import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

const PrimaryButton = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  variant = 'primary',
  loading = false,
  disabled = false
}: PrimaryButtonProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.border;
    if (variant === 'primary') return theme.primary;
    if (variant === 'secondary') return theme.secondary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'secondary') return theme.primary;
    return theme.primary;
  };

  const getBorderWidth = () => {
    if (variant === 'outline') return 2;
    return 0;
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: theme.primary,
            borderWidth: getBorderWidth(),
          }
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PrimaryButton;
