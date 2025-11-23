import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../AppStyles';

const InlineSelect = ({ label, value, options, onSelect, editable = true }) => (
  <View style={styles.profileField}>
    <Text style={styles.profileLabel}>{label}</Text>
    <View style={styles.inlineSelectRow}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.inlineSelectOption,
              isActive && styles.inlineSelectOptionActive,
              !editable && styles.inlineSelectOptionDisabled,
            ]}
            onPress={() => editable && onSelect(option.value)}
            disabled={!editable}
          >
            <Text
              style={[
                styles.inlineSelectText,
                isActive && styles.inlineSelectTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default InlineSelect;
