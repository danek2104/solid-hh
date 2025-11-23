import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles, theme } from '../AppStyles';

const ProfileFieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  error,
  autoCapitalize = 'none',
  editable = true,
}) => (
  <View style={styles.profileField}>
    <Text style={styles.profileLabel}>{label}</Text>
    <TextInput
      value={value ?? ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      style={[
        styles.profileInput,
        multiline && styles.profileInputMultiline,
        error && styles.profileInputError,
        !editable && styles.profileInputReadonly,
      ]}
      keyboardType={keyboardType}
      multiline={multiline}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      editable={editable}
      caretHidden={true}
      selectable={editable}
    />
    {!!error && <Text style={styles.profileStatusError}>{error}</Text>}
  </View>
);

export default ProfileFieldInput;
