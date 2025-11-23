import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileFieldInput from './ProfileFieldInput';
import InlineSelect from './InlineSelect';
import { theme } from '../AppStyles';

const ProfileFormFields = ({ form, errors, onFieldChange, editable = true }) => (
  <>
    <ProfileFieldInput
      label="ФИО"
      value={form.fullName}
      onChangeText={(value) => onFieldChange('fullName', value)}
      placeholder="Введите полное имя"
      error={errors.fullName}
      autoCapitalize="words"
      editable={editable}
    />
    <ProfileFieldInput
      label="Опыт работы"
      value={form.experience}
      onChangeText={(value) => onFieldChange('experience', value)}
      placeholder="Например: 6 лет, стройка и отделка"
      multiline
      editable={editable}
    />
    <ProfileFieldInput
      label="Документы"
      value={form.documentsNote}
      onChangeText={(value) => onFieldChange('documentsNote', value)}
      placeholder="Перечислите документы"
      multiline
      editable={editable}
    />
    <InlineSelect
      label="Готов к выездам"
      value={form.readyToTravel}
      options={[
        { label: 'По всей области', value: 'region' },
        { label: 'Только город', value: 'city' },
        { label: 'Без выездов', value: 'none' },
      ]}
      onSelect={(value) => onFieldChange('readyToTravel', value)}
      editable={editable}
    />
    <ProfileFieldInput
      label="Паспорт"
      value={form.passport}
      onChangeText={(value) => onFieldChange('passport', value)}
      placeholder="AA1234567"
      autoCapitalize="characters"
      error={errors.passport}
      editable={editable}
    />
    <View style={styles.profileField}>
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => {
            const newValue = !form.wasInRussia;
            onFieldChange('wasInRussia', newValue);
            if (!newValue) {
              onFieldChange('inn', '');
            }
          }}
          disabled={!editable}
          activeOpacity={0.7}
        >
          {form.wasInRussia && (
            <Ionicons name="checkmark" size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>Уже был на территории РФ</Text>
      </View>
    </View>
    <ProfileFieldInput
      label="ИНН"
      value={form.inn}
      onChangeText={(value) => onFieldChange('inn', value)}
      placeholder="9 цифр"
      keyboardType="number-pad"
      error={errors.inn}
      editable={editable && form.wasInRussia}
    />
    <ProfileFieldInput
      label="Телефон"
      value={form.phone}
      onChangeText={(value) => onFieldChange('phone', value)}
      placeholder="+79824167606"
      keyboardType="phone-pad"
      error={errors.phone}
      editable={editable}
    />
    <ProfileFieldInput
      label="WhatsApp"
      value={form.whatsapp}
      onChangeText={(value) => onFieldChange('whatsapp', value)}
      placeholder="+79824167606"
      keyboardType="phone-pad"
      error={errors.whatsapp}
      editable={editable}
    />
    <ProfileFieldInput
      label="Telegram"
      value={form.telegram}
      onChangeText={(value) => onFieldChange('telegram', value)}
      placeholder="@username"
      editable={editable}
    />
    <ProfileFieldInput
      label="Email"
      value={form.email}
      onChangeText={(value) => onFieldChange('email', value)}
      placeholder="worker@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      error={errors.email}
      editable={editable}
    />
  </>
);

export default ProfileFormFields;
