import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const BottomNavigation = ({ compact, activeTab, onSelect, items }) => (
  <View style={[styles.bottomNav, compact && styles.bottomNavCompact]}>
    {items.map((item) => (
      <TouchableOpacity
        key={item.label}
        style={styles.bottomNavItem}
        onPress={() => onSelect(item.key)}
        activeOpacity={0.9}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={item.key === activeTab ? '#C62828' : '#A0A0A0'}
        />
        <Text
          style={[
            styles.bottomNavLabel,
            item.key === activeTab && styles.bottomNavLabelActive,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default BottomNavigation;
