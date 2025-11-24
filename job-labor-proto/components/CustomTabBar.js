import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={localStyles.container}>
      <View style={[styles.bottomNav, localStyles.content]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          // Handle hidden tabs (checking if tabBarButton returns null)
          // This mimics the behavior of passing tabBarButton: () => null in screen options
          if (options.tabBarButton && typeof options.tabBarButton === 'function') {
             const btn = options.tabBarButton();
             if (btn === null) return null;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Icon Logic
          let iconName;
          switch (route.name) {
            case 'profile':
              iconName = isFocused ? 'person-circle' : 'person-circle-outline';
              break;
            case 'history':
              iconName = isFocused ? 'time' : 'time-outline';
              break;
            case 'reviews':
              iconName = isFocused ? 'star' : 'star-outline';
              break;
            case 'jobs':
              iconName = isFocused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'chats':
              iconName = isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'settings':
              iconName = isFocused ? 'settings' : 'settings-outline';
              break;
            case 'workers':
              iconName = isFocused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.bottomNavItem}
              activeOpacity={0.8}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? theme.primary : '#A0A0A0'}
              />
              <Text
                style={[
                  styles.bottomNavLabel,
                  isFocused && styles.bottomNavLabelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // Ensure clicks pass through empty space around the bar if necessary, 
    // but usually the bar is at the bottom.
    pointerEvents: 'box-none', 
  },
  content: {
    width: '100%',
    maxWidth: 600,
    // Override standard padding for better safe area handling if needed
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingTop: 12,
    // Reset borders/radius to ensure it looks like a floating card or grounded bar
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    // Ensure it captures touches
    pointerEvents: 'auto',
  },
});
