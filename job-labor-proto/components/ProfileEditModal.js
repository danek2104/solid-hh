import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, theme } from '../AppStyles';
import ProfileFormFields from './ProfileFormFields';
import ProfileFieldInput from './ProfileFieldInput';

const ProfileEditModal = ({
  visible,
  form = {},
  errors,
  onFieldChange,
  onClose,
  onSave,
  isDirty,
  isValid,
  isSaving,
}) => {
  const [isPassportUnlocked, setIsPassportUnlocked] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsPassportUnlocked(false);
    }
  }, [visible]);

  const handleUnlockPassport = () => {
    Alert.alert(
      "Изменение данных",
      "Вы уверены, что хотите изменить паспортные данные?",
      [
        {
          text: "Нет",
          style: "cancel"
        },
        { 
          text: "Да", 
          onPress: () => setIsPassportUnlocked(true) 
        }
      ]
    );
  };

  return (
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
              isPassportUnlocked={isPassportUnlocked}
              onUnlockPassport={handleUnlockPassport}
            />
            <ProfileFieldInput
              label="Старт"
              value={form?.startWindow}
              onChangeText={(value) => onFieldChange('startWindow', value)}
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
};

export default ProfileEditModal;
