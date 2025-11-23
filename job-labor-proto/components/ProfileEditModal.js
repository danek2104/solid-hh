import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import ProfileFormFields from './ProfileFormFields';
import ProfileFieldInput from './ProfileFieldInput';

const ProfileEditModal = ({
  visible,
  form,
  errors,
  onFieldChange,
  onClose,
  onSave,
  isDirty,
  isValid,
  isSaving,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.profileModalOverlay}>
      <View style={styles.profileModalContent}>
        <View style={styles.profileModalHeader}>
          <Text style={styles.profileModalTitle}>Редактировать профиль</Text>
          <TouchableOpacity onPress={onClose} style={styles.profileModalClose}>
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.profileModalBody}
          showsVerticalScrollIndicator={false}
        >
          <ProfileFormFields
            form={form}
            errors={errors}
            onFieldChange={onFieldChange}
          />
          <ProfileFieldInput
            label="Старт"
            value={form.startWindow}
            onChangeText={(value) => onFieldChange('startWindow', value)}
          />
          <ProfileFieldInput
            label="Минимальная ставка"
            value={form.minRate}
            onChangeText={(value) => onFieldChange('minRate', value)}
          />
          <ProfileFieldInput
            label="Желаемая ставка"
            value={form.desiredRate}
            onChangeText={(value) => onFieldChange('desiredRate', value)}
          />
        </ScrollView>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalSecondaryButton} onPress={onClose}>
            <Text style={styles.modalSecondaryButtonText}>Отменить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalPrimaryButton,
              (!isDirty || !isValid || isSaving) && styles.buttonDisabled,
            ]}
            onPress={onSave}
            disabled={!isDirty || !isValid || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.modalPrimaryButtonText}>Сохранить</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default ProfileEditModal;
